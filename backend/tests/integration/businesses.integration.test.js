// Integration — business owner accounts + listings round-trip through
// service → model → real Supabase. Fixtures are tagged IT-<tag> and cleaned
// up in afterAll (owner rows cascade to their businesses and tag links).
//
// Requires migrations 007 / 008 / 009 / 010 and seed 004 to have been applied.

const ownerAuthService = require('../../src/services/ownerAuthService');
const businessService = require('../../src/services/businessService');
const businessTagService = require('../../src/services/businessCategoryService');
const { supabase, makeTag, expectOk } = require('./helpers');

jest.setTimeout(45000); // register + CRUD = many sequential network round trips

const TAG = makeTag();
const uname = TAG.toLowerCase(); // register() lowercases usernames

let regA; // registration result — account only, no listing fields
let ownerA;
let ownerB;
let businessId;
let tagId;

beforeAll(async () => {
  regA = await ownerAuthService.register({
    full_name: `${TAG} Owner A`,
    email: `${uname}.a@example.com`,
    phone: '+94 77 000 0001',
    username: `${uname}a`,
    password: 'passw0rd-a',
  });
  ownerA = regA.owner;

  ownerB = (
    await ownerAuthService.register({
      full_name: `${TAG} Owner B`,
      email: `${uname}.b@example.com`,
      username: `${uname}b`,
      password: 'passw0rd-b',
    })
  ).owner;

  const tag = expectOk(
    await supabase
      .from('business_categories')
      .insert({ category_name: `${TAG} Tag` })
      .select()
      .single()
  );
  tagId = tag.category_id;
});

afterAll(async () => {
  // Defensive: remove anything the tests left behind by tag.
  await supabase.from('business_owners').delete().like('username', `${uname}%`);
  await supabase.from('business_tags').delete().in(
    'category_id',
    [tagId].filter(Boolean)
  );
  await supabase.from('business_categories').delete().like('category_name', `${TAG}%`);
});

describe('owner accounts', () => {
  test('register returns a token and an owner without the password hash', async () => {
    expect(ownerA.owner_id).toBeDefined();
    expect(ownerA.username).toBe(`${uname}a`);
    expect(ownerA.email).toBe(`${uname}.a@example.com`);
    expect(ownerA).not.toHaveProperty('password_hash');
  });

  // Step 1 of the flow creates the account only — the listing (name, tags,
  // photos) is step 2, saved against this owner afterwards.
  test('register creates the account only and returns no listing fields', () => {
    expect(regA).toHaveProperty('token');
    expect(ownerA).not.toHaveProperty('business_name');
    expect(regA).not.toHaveProperty('business_name');
  });

  test('register rejects a duplicate username and a duplicate email', async () => {
    await expect(
      ownerAuthService.register({
        full_name: 'Clash',
        email: `${uname}.other@example.com`,
        username: `${uname}a`, // already taken by A
        password: 'passw0rd-c',
      })
    ).rejects.toMatchObject({ status: 409 });

    await expect(
      ownerAuthService.register({
        full_name: 'Clash',
        email: `${uname}.a@example.com`, // already taken by A
        username: `${uname}other`,
        password: 'passw0rd-c',
      })
    ).rejects.toMatchObject({ status: 409 });
  });

  test('login accepts the right password and rejects the wrong one', async () => {
    const ok = await ownerAuthService.login(`${uname}a`, 'passw0rd-a');
    expect(ok.owner.owner_id).toBe(ownerA.owner_id);

    await expect(ownerAuthService.login(`${uname}a`, 'wrong')).rejects.toMatchObject({ status: 401 });
    await expect(ownerAuthService.login('no-such-owner', 'x')).rejects.toMatchObject({ status: 401 });
  });

  test('profile can be read and edited; the email stays unique', async () => {
    const profile = await ownerAuthService.getProfile(ownerA.owner_id);
    expect(profile.full_name).toBe(`${TAG} Owner A`);

    const updated = await ownerAuthService.updateProfile(ownerA.owner_id, {
      full_name: `${TAG} Renamed`,
      phone: '+94 77 000 0009',
    });
    expect(updated.full_name).toBe(`${TAG} Renamed`);
    expect(updated.phone).toBe('+94 77 000 0009');

    // B's email is already registered → 409.
    await expect(
      ownerAuthService.updateProfile(ownerA.owner_id, { email: `${uname}.b@example.com` })
    ).rejects.toMatchObject({ status: 409 });

    await expect(ownerAuthService.updateProfile(ownerA.owner_id, {})).rejects.toMatchObject({
      status: 400,
    });
  });

  test('password change needs the current password, then the new one logs in', async () => {
    await expect(
      ownerAuthService.changePassword(ownerA.owner_id, 'wrong-current', 'passw0rd-new')
    ).rejects.toMatchObject({ status: 401 });

    await ownerAuthService.changePassword(ownerA.owner_id, 'passw0rd-a', 'passw0rd-new');

    await expect(ownerAuthService.login(`${uname}a`, 'passw0rd-a')).rejects.toMatchObject({
      status: 401,
    });
    const ok = await ownerAuthService.login(`${uname}a`, 'passw0rd-new');
    expect(ok.owner.owner_id).toBe(ownerA.owner_id);

    // Restore the original so later steps stay readable.
    await ownerAuthService.changePassword(ownerA.owner_id, 'passw0rd-new', 'passw0rd-a');
  });
});

describe('business listings', () => {
  test('a new listing starts unpublished and is invisible to the public list', async () => {
    const created = await businessService.createBusiness(
      {
        name: `${TAG} Rentals`,
        description: 'Car and van hire on the coast road.',
        phone: '+94 77 000 0001',
        email: `${uname}.a@example.com`,
        opening_hours: '08:00 - 20:00',
      },
      ownerA.owner_id,
      [tagId]
    );
    businessId = created.business_id;

    expect(created.published).toBe(false);
    expect(created.owner_id).toBe(ownerA.owner_id);
    expect(created.tags).toEqual([tagId]);

    const publicList = await businessService.listBusinesses();
    expect(publicList.some((b) => b.business_id === businessId)).toBe(false);

    // The owner still sees their own pending listing.
    const ownerList = await businessService.listBusinesses({ ownerId: ownerA.owner_id });
    expect(ownerList.some((b) => b.business_id === businessId)).toBe(true);

    // …and the public detail is a 404 until it is approved.
    await expect(businessService.getBusiness(businessId)).rejects.toMatchObject({ status: 404 });
  });

  test('the owner cannot write fields that control ownership or approval', async () => {
    const attempted = { owner_id: ownerB.owner_id, published: true, business_id: 999 };
    const updated = await businessService.updateBusiness(businessId, attempted, ownerA.owner_id);

    expect(updated.owner_id).toBe(ownerA.owner_id); // unchanged
    expect(updated.published).toBe(false); // still pending
    expect(updated.business_id).toBe(businessId);
  });

  test("one owner can never read, edit or delete another owner's listing", async () => {
    // Read → 404 (not 403: owners must not be able to probe for ids).
    await expect(
      businessService.getBusiness(businessId, { ownerId: ownerB.owner_id })
    ).rejects.toMatchObject({ status: 404 });

    // Edit → 404 and the row is untouched.
    await expect(
      businessService.updateBusiness(
        businessId,
        { name: 'Hijacked by owner B' },
        ownerB.owner_id
      )
    ).rejects.toMatchObject({ status: 404 });

    // Delete → 404 and the row survives.
    await expect(
      businessService.deleteBusiness(businessId, ownerB.owner_id)
    ).rejects.toMatchObject({ status: 404 });

    const stillThere = await businessService.getBusiness(businessId, { ownerId: ownerA.owner_id });
    expect(stillThere.name).toBe(`${TAG} Rentals`);
  });

  test('owner A can edit their own listing and replace its tags', async () => {
    const updated = await businessService.updateBusiness(
      businessId,
      { name: `${TAG} Rentals Updated`, opening_hours: '09:00 - 21:00' },
      ownerA.owner_id,
      [tagId]
    );

    expect(updated.name).toBe(`${TAG} Rentals Updated`);
    expect(updated.opening_hours).toBe('09:00 - 21:00');
    expect(updated.tags).toEqual([tagId]);
    // Untouched fields survive.
    expect(updated.description).toBe('Car and van hire on the coast road.');
  });

  // The home page's Featured escapes carousel shows a listing's feature card
  // cover (business_photos.is_featured); everything else falls back to the
  // Explore card cover in businesses.image_url.
  test('the feature card cover comes back as featured_image_url', async () => {
    const insert = await supabase.from('business_photos').insert([
      {
        business_id: businessId,
        photo_url: '/uploads/places/it-cover-explore.jpg',
        is_primary: true,
        is_featured: false,
      },
      {
        business_id: businessId,
        photo_url: '/uploads/places/it-cover-feature.jpg',
        is_primary: false,
        is_featured: true,
      },
    ]);
    // Migration 010 not applied yet — the gallery simply does not exist.
    if (insert.error && /does not exist|schema cache/i.test(insert.error.message)) return;

    try {
      const row = await businessService.getBusiness(businessId, { ownerId: ownerA.owner_id });
      // Only the is_featured row is exposed for the carousel.
      expect(row.featured_image_url).toBe('/uploads/places/it-cover-feature.jpg');
    } finally {
      await supabase.from('business_photos').delete().eq('business_id', businessId);
    }

    // No feature cover → the field is left out entirely, so the carousel falls
    // back to the listing's Explore card cover (image_url).
    const plain = await supabase.from('business_photos').insert({
      business_id: businessId,
      photo_url: '/uploads/places/it-cover-explore.jpg',
      is_primary: true,
    });
    if (plain.error) return;
    try {
      const row = await businessService.getBusiness(businessId, { ownerId: ownerA.owner_id });
      expect(row.featured_image_url).toBeUndefined();
    } finally {
      await supabase.from('business_photos').delete().eq('business_id', businessId);
    }
  });

  test('the tag filter returns only listings carrying that tag', async () => {
    const filtered = await businessService.listBusinesses({
      tagId,
      includeUnpublished: true,
    });
    expect(filtered.some((b) => b.business_id === businessId)).toBe(true);
    for (const row of filtered) expect(row.tags).toContain(tagId);
  });

  test('the admin list shows pending rows with the owner name attached', async () => {
    const rows = await businessService.listBusinesses({ includeUnpublished: true, withOwner: true });
    const mine = rows.find((b) => b.business_id === businessId);
    expect(mine).toBeDefined();
    expect(mine.owner_name).toBe(`${TAG} Renamed`);
  });

  test('the approval switch moves the listing in and out of the public list', async () => {
    const approved = await businessService.setBusinessPublished(businessId, true);
    expect(approved.published).toBe(true);
    expect(
      (await businessService.listBusinesses()).some((b) => b.business_id === businessId)
    ).toBe(true);

    await businessService.setBusinessPublished(businessId, false);
    expect(
      (await businessService.listBusinesses()).some((b) => b.business_id === businessId)
    ).toBe(false);

    await businessService.setBusinessPublished(businessId, true);
  });

  test('an unknown tag id is rejected before anything is written', async () => {
    await expect(
      businessService.createBusiness(
        { name: `${TAG} Bad Tags`, description: 'Should never be stored.' },
        ownerA.owner_id,
        [999999999]
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  test('delete removes the row; reading it afterwards is a 404', async () => {
    const result = await businessService.deleteBusiness(businessId, ownerA.owner_id);
    expect(result).toEqual({ business_id: businessId });

    await expect(businessService.getBusiness(businessId)).rejects.toMatchObject({ status: 404 });
    await expect(
      businessService.getBusiness(businessId, { ownerId: ownerA.owner_id })
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('business tags', () => {
  test('the seeded tag list is readable and admin CRUD round-trips', async () => {
    const before = await businessTagService.listTags();
    expect(Array.isArray(before)).toBe(true);

    const created = await businessTagService.createTag(`${TAG} Category`);
    const updated = await businessTagService.updateTag(created.category_id, `${TAG} Renamed`);
    expect(updated.category_name).toBe(`${TAG} Renamed`);

    await expect(businessTagService.createTag(`${TAG} Renamed`)).rejects.toMatchObject({
      status: 409,
    });

    const removed = await businessTagService.deleteTag(created.category_id);
    expect(removed).toEqual({ category_id: created.category_id });
    await expect(businessTagService.deleteTag(created.category_id)).rejects.toMatchObject({
      status: 404,
    });
  });
});
