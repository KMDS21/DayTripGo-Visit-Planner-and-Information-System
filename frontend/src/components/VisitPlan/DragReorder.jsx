// DragReorder — HTML5 drag-and-drop reorder container (SRS FR-13).
// No extra dependency; keyboard users reorder via the arrow buttons in PlanItem.

import { useRef, useState } from 'react';

export default function DragReorder({ items, onMove, renderItem }) {
  const dragFrom = useRef(null);
  const [overIndex, setOverIndex] = useState(null);

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
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}
