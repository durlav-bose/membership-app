import React from "react";

const TabBar = ({ items, selectedItemId, onAction }) => {
  const [hoveredId, setHoveredId] = React.useState(null);

  return (<ul style={{
    display: "flex",
    flexDirection: "row",
    listStyle: "none",
    gap: "4px",
    margin: "0px",
    padding: "0px 0px 8px 0px",
  }}>
    {items.map((item) => {
      const { id, title } = item;

      return (<li
        key={id}
        onMouseEnter={() => setHoveredId(id)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={() => onAction(item)}
        style={{
          padding: "6px 12px",
          backgroundColor: id === selectedItemId ? "#f1f8f5" : (hoveredId === id ? "#f1f1f1" : "transparent"),
          borderRadius: "4px",
          color: id === selectedItemId ? "#007f5f" : (hoveredId === id ? "#1f1f1f" : "#6f6f6f"),
          fontSize: "12px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {title}
      </li>);
    })}
  </ul>);
};

export default TabBar;
