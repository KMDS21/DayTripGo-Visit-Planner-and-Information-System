Tour -Visit Planner (DayTripGO **)** 

A Web-Based Visit Planning System for Wadduwa, Sri Lanaka and Surrounding Areas 

Student Name - De Silva P.K.M Registration Number - E2410884 

# **Table of Contents** 

|1. Introduction ..................................................................................................................................................... 3|
|---|
|1.1 Problem Statement......................................................................................................................................... 3|
|1.2 Aim ................................................................................................................................................................ 3|
|1.3 Project Objectives .......................................................................................................................................... 4|
|1.4 Scope and Limitations ................................................................................................................................... 4|
|1.4.1 Scope ...................................................................................................................................................... 4|
|1.4.2 Limitations .............................................................................................................................................. 4|
|1.5 Target Users................................................................................................................................................... 5|
|1.6 Stakeholder Identification Plan ..................................................................................................................... 5|
|Table 1: Satakeholder Analysis ................................................................................................................... 5|
|1.7 Proposed System Overview ........................................................................................................................... 6|
|1.8 Technology Stack .......................................................................................................................................... 6|
|1.9 Preliminary List of Places ............................................................................................................................. 7|
|Conclusion ........................................................................................................................................................... 8|
|References ........................................................................................................................................................... 8|
|Appendix A ......................................................................................................................................................... 9|
|Stakeholder Consultation Evidence ................................................................................................................. 9|
|Appendix B ........................................................................................................................................................ 10|
|Gantt chart ..................................................................................................................................................... 10|



|**Table of Tables**|
|---|
|1. Table 1 : List of attractive places ....................................................................................................... 5|
|2. Table 2 : Satakeholder Analysis Satakeholder Analysis.................................................................... 7|
|3. Table 3 : Project Plan Gantt Chart Analysis .................................................................................... 10|
|**Table of Figure**|
|1. Figure 1 : Project Plan Gantt Chart (12-Week / 3-Month Timeline) ............................................... 10|



2 

# **1. Introduction** 

Wadduwa is a coastal town in the Kalutara District of Sri Lanka's Western Province, roughly 33 km south of Colombo along the Galle Road and coastal railway line. Within a 25 km radius of Wadduwa lies a varied mix of attractions, the golden beaches of Wadduwa, Kalutara and Beruwala, religious landmarks such as the Kalutara Bodhiya and the Kande Viharaya in Aluthgama, heritage sites including Richmond Castle and the Beruwala (Barberyn) Lighthouse, and nature based attractions such as Bolgoda Lake. 

Despite this variety, information about these places is scattered across travel blogs, hotel websites and social media, and is rarely organised in a way that helps a visitor plan a single day trip. Tourists staying in or passing through Wadduwa often rely on informal recommendations from hotel staff or tuk-tuk drivers rather than a single, reliable source that lists opening times, travel distances and practical tips. This project addresses that gap by proposing a web based Tourist Day Visit Planner focused on the Wadduwa locality, allowing a tourist to browse verified places of interest, filter them by category, view them on a map, and build a simple one day visit plan without booking or payment features, which are outside the scope of this project. 

# **1.1 Problem Statement** 

Tourists visiting the Wadduwa area struggle to find reliable, consolidated information about nearby places of interest, since existing sources are fragmented across travel blogs, hotel pages and social media rather than a single organised platform. Essential planning details accurate opening times, realistic travel distances and practical visit tips are often missing or outdated, which makes it difficult for a visitor to construct a realistic one day itinerary. Solving this problem matters because it directly affects the visitor experience in a locality that depends on tourism, and because no existing local level system currently fills this gap for the Wadduwa area. 

# **1.2 Aim** 

To design and develop a web based information and visit planning system that helps tourists discover and plan a one day visit to places of interest within 25 km of Wadduwa, Sri Lanka. 

3 

# **1.3 Project Objectives** 

- To identify and document at least 10 verified places of interest within 25 km of Wadduwa, across categories such as religious, nature, heritage and cultural sites. 

- To elicit and validate tourist information requirements through structured consultation with four stakeholders. 

- To design a relational database and system architecture capable of storing place, category and visit plan data. 

- To implement a working web application allowing tourists to view, filter, and map places of interest. 

- To implement a simple one day visit-plan builder that lets a tourist select and order places from the list. 

- To implement administrator functionality for adding, editing and deleting place records, and to evaluate the system against the SRS through testing and stakeholder feedback. 

# **1.4 Scope and Limitations** 

# **1.4.1 Scope** 

- A minimum of 10 places of interest located within 25 km of the developer's home in Wadduwa. 

- Categories including religious, nature, heritage and cultural sites. 

- Detailed place pages showing description, opening times, travel tips and distance from Wadduwa. 

- Map based viewing of each place's location. 

- A simple one day visit-plan builder allowing a tourist to select places and view them as a single itinerary. 

- Category filtering for the tourist-facing place listing. 

- An administrator function to add, edit and delete place records. 

# **1.4.2 Limitations** 

- No booking facilities for accommodation, tours or activities. 

- No online payment or transaction processing of any kind. 

- No hotel or transport reservation functionality. 

- No multi day itinerary planning the system is limited to single day visit plans. 

4 

# **1.5 Target Users** 

- Tourist (primary user), A domestic or foreign visitor staying in or near Wadduwa who wants to browse nearby places of interest, filter them by category, view essential details and locations, and build a one day visit plan. 

- Administrator (secondary user), A person responsible for keeping the place of interest information accurate and up to date, with the ability to add, edit and delete place records through a restricted administrator interface. 

# **1.6 Stakeholder Identification Plan** 

Table 1 summarises each stakeholder and the key requirement they raised, full discussion notes are provided in Appendix A. 

|**Stakeholder**|**Role**|**Key Requirement Identified**|
|---|---|---|
|Sara MHS|Tourist / VisitorPublic|Needs clear categories, location maps, opening<br>hours, and simple trip planning with public<br>transport and route mapping features.|
|De Silva PKM|Business Owner|Requires enhanced local business visibility<br>through<br>a<br>featured<br>section,<br>nearby<br>dining/shopping<br>recommendations,<br>and<br>detailed info cards with locations, hours, and<br>contacts.|
|Kumarasiri RDKA|Tourism Guide|Needs practical travel information, suitable<br>visiting times, distances, route maps, and an<br>efficient one-day planning feature.|
|||Requires the ability to add, edit, and delete|
|Jayawickrama KKSD|Site Administrator|places to maintain accurate descriptions,<br>categories, opening hours, and travel tips.|
|||Accurate and useful tourism information,|
|Dharmawardhana<br>WNL|Destination Management<br>Organization (DMO)|appropriate<br>categorization,<br>good<br>visitor<br>experience and keeping the system focused on<br>tourism information rather than bookings..|



Table 1: Satakeholder Analysis 

5 

# **1.7 Proposed System Overview** 

The system will be a responsive web application with two main interfaces, a public facing tourist interface and a restricted administrator interface, backed by a shared database of places, categories and visit plans. 

A tourist will land on a home page listing places of interest, which can be filtered by category (e.g. religious, nature, heritage, cultural). Selecting a place opens a details page showing its description, opening times, travel tips and distance from Wadduwa, along with its location plotted on an embedded map. From the listing, the tourist can add places to a simple one-day visit plan, which displays the selected places in a single consolidated view. 

An administrator will log in through a separate, access controlled interface to add, edit or delete place records, keeping the information current without needing to alter the underlying code. 

- Place listing with category filter (Tourist) 

- Place detail view with description, hours, tips and distance (Tourist) 

- Map view of place location (Tourist) 

- One-day visit-plan builder (Tourist) 

- Add / edit / delete place records (Administrator) 

# **1.8 Technology Stack** 

- Frontend: HTML5, CSS3, React 

- Backend: Node.js with Express 

- Database: Superbase 

- Development Tools: Visual Studio Code, Postman, Figma (for UI mockups) 

- Version Control: Git, hosted on GitHub 

6 

# **1.9 Preliminary List of Places** 

Table lists 10 preliminary places of interest identified within approximately 25 km of Wadduwa, covering nature, religious, heritage and cultural categories. Distances are approximate road distances from Wadduwa town centre and should be remeasured from the exact home address before the SRS is finalised the last entry sits close to the 25 km boundary and should be confirmed or replaced. 

|**Place Name**|**Category**|**Distance**|**Description**|
|---|---|---|---|
||||A coastal beach area near Panadura town, a|
|Panadura Beach|Nature|7 km|short trip north along the coastal<br>road/railway.|
|Bolgoda Lake|Nature|14 km|The largest fresh-water lake in Sri Lanka,<br>popular for boat rides and bird watching.|
||||A well-known Buddhist shrine beside the|
|Kalutara Bodhiya|Religious|11 km|Kalu Ganga, noted for its stupa, said to be the<br>only completely hollow stupa in the world.|
||||A colonial-era mansion (c.1896) in Kalutara|
|Richmond Castle|Heritage|12 km|blending local and Western architectural<br>styles, open to the public.|
||||A tranquil beach near Kalutara town, suitable|
|Kalutara Beach|Nature|11 km|for swimming and relaxing, close to the<br>Kalutara Bodhiya.|
|Beruwala (Barberyn)<br>Lighthouse|Heritage|19 km|A 19th-century lighthouse on Barberyn Island<br>off Beruwala, offering coastal views.|
|Brief Garden (Bevis<br>Bawa)|Cultural|21 km|A landscaped garden estate near Dedduwa<br>designed by artist and landscape architect<br>Bevis Bawa.|
||||An ancient Buddhist temple in Aluthgama|
|Kande Viharaya|Religious|22 km|known for its murals, carvings and large<br>seated Buddha statue.|
|Thudugala Ella<br>Kaluthra|Nature|23 km|The Thudugala Ella waterfall is located in<br>Thudugala village in Dodangoda|
|Magical sapphire<br>natural pool, Kalutara|Nature|20 km|A natural pool has been enhanced with a<br>constructed pond suitable for bathing|



_Table 2: List of attractive places_ 

7 

# **Conclusion** 

This proposal outlines a focused, achievable web application that fills a genuine information gap for tourists visiting the Wadduwa area, while giving practical experience in requirements elicitation, stakeholder consultation, web system design and implementation. On completion, the project is expected to deliver a working information and visit-planning system, a validated SRS grounded in real stakeholder input, and a portfolio piece demonstrating the full software development lifecycle applied to a small, realistic system. 

# **References** 

[1] TripAdvisor, "Wadduwa, Sri Lanka: All you must know before you go," tripadvisor.com. [Online]. Available: https://www.tripadvisor.com/Tourism-g499081-Wadduwa_Western_ProvinceVacations.html 

[2] Discovering Sri Lanka, "Wadduwa: top 10 attractions to visit," wildtrips.net. [Online]. Available: https://www.wildtrips.net/visit/Wadduwa-Sri-Lanka-top-10-attractions-to-visit.htm 

[3] The Small Hotels of the World, "Places to see in Wadduwa," thesmallhotels.com. [Online]. Available: https://www.thesmallhotels.com/places-to-see-in-wadduwa-sri-lanka 

[4] Blue Water Wadduwa, "Things to do in Wadduwa," bluewatersrilanka.com. [Online]. Available: https://www.bluewatersrilanka.com/experience-type/things-to-do/ 

[5] Contemporary Ceylon, "Top things to do in Wadduwa, Sri Lanka," contemporaryceylon.com, Nov. 2025. [Online]. Available: https://www.contemporaryceylon.com/post/top-things-to-do-inwadduwa-sri-lanka-a-hidden-coastal-gem-near-colombo 

[6] Rome2rio, "Wadduwa to Kalutara," rome2rio.com. [Online]. Available: 

<u>https://www.rome2rio.com/s/Wadduwa/Kalutara</u> 

8 

# **Appendix A** 

# **Stakeholder Consultation Evidence** 



<!-- Start of picture text -->
Discussion for Project Requirements - DayTripGO System (acum fr fe Anqureneet Goren<br>DutnhinmiesnomcetSor PettrePcgrerartsDayTHG0D8 =|<br>‘EDAD eta Wee3 Amo n Sten20ieTASPRL<br>ween<br>| atonnary re nmaeriets tg ca acct Me te wb anor aed DAD Mc Nc a a an a ration 9G fc a ace test MFM a Nd fe<br>(tect aa te aye ese 8 os a Ant Me ou Wu ate re 8. yD RH fT mI Le MAND a a a eENEY?<br>ee ey een rat ratte rts tiny nea!<br>PeKameyou<br>Fermekes Resty Boat<br>0portito<br>{ieS2eNORSPactrnaOmcanates or Pegs Ragaremares yc Syren<br>‘ MOUS taney,ag 2028 9.07 Me<br>ket<br>Tesertiespre rreene Onur seal mur tr ene foreet tr he Yao ema wren rarer wl te neve cht Danae ere i oan fbn ney | et Fr ee te<br>Pete taconiteWE ae He Ora eSal ey sb: EAA SRT CA aay LAL Sa we EN EAC AC oa oan ihe ae Ne a Pane ah<br>(pirate eaggeng nt tra rac see Toate Serene ater ne any ergore peste shea =feere et tte ne<br>ner eran Skater ape<br>Sesatsegmce<br>‘reeabeh stom saert—apty<br><!-- End of picture text -->



<!-- Start of picture text -->
Discussion for Project Requirements Continue..<br>Traoly‘4 bvcun molesforesied Project R ae r s aT GO System FuresimdnyoS Ore ny Vat Sara<br>Lbscunatn for Projeform Reqatrements= fii = |<br>‘oy EXEVOBA De Sea FXO - Suan 9 AaaCente2028, 1190 AM<br>i preyene<br>‘Temata mie local tshimees can Yay bent from te att wre eae tg Us gral uty whe Yours ae larry he In Hv ae af ational al recurermets twat Se 2<br>swage,<br>+ Festced Loca! Spots Section: & dedicated section on He man pape spectfoaly Naigtbng local cling ad shope to gab the wsers aMeTHON gh Hwa<br>“+ Neary Recemmandatins: hn sume cichnm 4 maa at tien the gre uh narmatay ase hoe bt of vextmirt oF sey oats che oa we<br>“+ Detaled inde Cards: Clearcroftes tr each buses chow the exnct map location curere seen hour. ate ntact etn 90 tars can eae fda<br>Let me ou these features are doable ant ow you this Rey mi 18 to te ower design!<br>Bes.<br>Kavmashe<br>Poomairk Ett Delete Reshy spent<br>to porto<br><!-- End of picture text -->



<!-- Start of picture text -->
‘netematy<br>merkcngHt One Cap Yat Pare<br>‘hey EDSyet el apa aturesHARD Staceya eAsi e  2008 ere842 AN chy tt fey econ tree otw ect e eure! Faergar i enpate n 2<br>‘eases str ry am er<br>dct<br>+ as fy wat et<br>2 culOe€somonepacts acecoment ma rete ty<br>+ sre nec jacan 1 wmstabis wat re<br>* carmcera me obese a ken nes ent ae<br>1 Sineceea te ree! ne trene Sete ares<br>{+ Show a etree me eterno<br>save reine soe apt veh ap a wl ve tea oy acct<br>Femntrh Fey<br>(beSy EQENRREA unctanteyfh ne Day a Meme<br>He amen De Sa Pa enn Hao 2008, 1128 04<br>Srfrm nupearpreening ets se,rr panesa regrhswa i Sowa Arc Ae hs Ae ae am ge em My yr eae cafe,<br>nds serge wy<br>secant She ere wet rete eer pete er aren wn sc newman)<br>fearegmts<br>soe<br>Premise wpment Ge Deete Bay ettogmtnte<br><!-- End of picture text -->

9 

# **Appendix B** 

# **Gantt chart** 

The project is planned over a 12-week (3-month) timeline, from stakeholder consultation and proposal through to final presentation and demonstration. Figure 1 shows the Gantt chart; Table  lists the same activities with their planned week ranges. 



<!-- Start of picture text -->
worojectPlan Gantt Chart (12-Week{3-Month Timeline)<br>Stakeholder Consultation & Proposal we 1.2<br>Requirements Analysis & SRS |<br>‘System Design (08, Ui Mockups, Architecture} |sD<br>Frontend Implementation (Tourist Ul) fs<br>Backend & Database Implementation ee<br>Admin Module Implementation |a<br>Integration & Testing EE: 00<br>Bug Fixing & Refinement | aw<br>Documentation Finalisation GB «ue<br>Presentation Preparation & Demo | fee<br>0 1 2 3 4 5 6 7 8 9 w nu R<br>Week<br><!-- End of picture text -->

_Figure 1: Project Plan Gantt Chart (12-Week / 3-Month Timeline)_ 

|**Activity**|**Week(s)**|
|---|---|
|Stakeholder Consultation & Proposal|1-2|
|Requirements Analysis & SRS|2-4|
|System Design (DB, UI Mockups, Architecture)|4-6|
|Frontend Implementation (Tourist UI)|6-8|
|Backend & Database Implementation|6-8|
|Admin Module Implementation|8-9|
|Integration & Testing|9-10|
|Bug Fixing & Refinement|10-11|
|Documentation Finalisation|10-12|
|Presentation Preparation & Demo|11-12|



_Table 3: Project Plan Gantt Chart Analysis_ 

10 

