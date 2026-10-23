// DragReorder — HTML5 drag-and-drop reorder container (SRS FR-13).
// No extra dependency; keyboard/touch users reorder via the arrow buttons in
// PlanItem (HTML5 drag does not fire on touchscreens).
// Children may be given as a render function: {(item, index) => <Item … />}

import { useRef, useState } from 'react';

export default function DragReorder({ items, onMove, renderItem, children }) {
  const dragFrom = useRef(null);
  const [overIndex, setOverIndex] = useState(null);

  // Accept either the `renderItem` prop or a children render function
  // (PlanList passes children; earlier code expected `renderItem` and crashed
  // with "renderItem is not a function" as soon as a plan had items).
  const render = typeof children === 'function' ? children : renderItem;

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={item.place_id}
          draggable
          onDragStart={() => {
            dragFrom.current = index;
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOverIndex(index);
          }}
          onDragLeave={() => setOverIndex((prev) => (prev === index ? null : prev))}
          onDrop={(e) => {
            e.preventDefault();
            if (dragFrom.current !== null && dragFrom.current !== index) {
              onMove(dragFrom.current, index);
            }
            dragFrom.current = null;
            setOverIndex(null);
          }}
          onDragEnd={() => {
            dragFrom.current = null;
            setOverIndex(null);
          }}
          className={`cursor-grab rounded-2xl transition-all active:cursor-grabbing ${
            overIndex === index ? 'ring-2 ring-brand/60' : ''
          }`}
        >
          {render ? render(item, index) : null}
        </li>
      ))}
    </ul>
  );
}
