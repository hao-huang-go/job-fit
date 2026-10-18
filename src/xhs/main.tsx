import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import XhsApp from "./XhsApp";

// Flex `gap` arrived after the container's Chrome 61 baseline; measure it rather than trusting @supports.
function flexGapWorks(): boolean {
  const box = document.createElement("div");
  box.style.display = "flex";
  box.style.flexDirection = "column";
  box.style.rowGap = "1px";
  box.appendChild(document.createElement("div"));
  box.appendChild(document.createElement("div"));
  document.body.appendChild(box);
  const works = box.scrollHeight === 1;
  document.body.removeChild(box);
  return works;
}

if (!flexGapWorks()) document.documentElement.classList.add("no-flex-gap");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <XhsApp />
  </StrictMode>,
);
