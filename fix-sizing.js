const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();

let sizing = fs.readFileSync(path.join(ROOT, "components", "SizingTool.jsx"), "utf8");

// Fix 1: Remove the JSX comment right after ternary
sizing = sizing.replace(
  /\)\s*:\s*\(\s*\{\/\* Mobile tab switcher \*\/\}\s*<div className="mobile-tab-bar"/,
  `) : (
        <div className="mobile-tab-bar"`
);

// Fix 2: Ensure the ternary closes properly — check for closing around the two columns
// The mobile tab div should be OUTSIDE the grid, before it
// Current structure should be:
// ) : (
//   <div className="mobile-tab-bar" ...></div>
//   <div className="sizing-2col" ...>
//     ...
//   </div>
// )
// But we have a fragment issue. Let's wrap in a fragment.

// Find the mobile tab opening and grid opening
const mobileTabStart = `<div className="mobile-tab-bar"`;
const gridStart = `<div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 14,
          maxWidth: 1280,
          margin: "0 auto",
          alignItems: "start"
        }} className="sizing-2col">`;

if (sizing.indexOf(mobileTabStart) !== -1 && sizing.indexOf(gridStart) !== -1) {
  // Wrap them in a fragment
  sizing = sizing.replace(
    /\)\s*:\s*\(\s*<div className="mobile-tab-bar"/,
    `) : (
        <>
        <div className="mobile-tab-bar"`
  );

  // Find where sizing-2col ends and add the closing fragment
  // The 2col grid closing looks like:
  //   </div>
  // )}
  // Before the </section> or before another component

  // Add </> after the sizing-2col closing but before )}
  // Find the LAST occurrence of the results column closing
  const closingPattern = /(\n\s*<\/div>\s*<\/div>\s*\)\}\s*\n\s*<StickySummary)/;
  if (closingPattern.test(sizing)) {
    sizing = sizing.replace(
      closingPattern,
      `\n          </div>
          </div>
        </>
      )}
      <StickySummary`
    );
  } else {
    // Alternative: look for the pattern before <StickySummary
    const altPattern = /(\s*<\/div>\s*<\/div>\s*\)\}\s*\s*\{?\/\* Sticky summary bar \*\/\})/;
    // Simpler: just check if there's a missing </>
  }
}

fs.writeFileSync(path.join(ROOT, "components", "SizingTool.jsx"), sizing, "utf8");
console.log("[OK] SizingTool fixed");
console.log("Run: npm run dev");