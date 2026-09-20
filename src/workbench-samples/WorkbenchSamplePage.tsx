export default function WorkbenchSamplePage() {
  return (
    <main
      style={{

        display: "flex",
        alignItems: "flex-start",
        justifyItems: 'center',
        flexDirection: "column", justifyContent: "flex-start", flexWrap: "nowrap", gap: "var(--ds-spacing-8)", width: "100%", height: "100%", background: "var(--ds-color-background)",
      }}
    >








      <div style={{ display: "flex", gap: "var(--ds-spacing-2)", flexDirection: "column", width: "100%" }}>        <h1 style={{ fontSize: "var(--ds-spacing-text-3xl)", color: "var(--ds-color-foreground)" }}>Surface</h1><div style={{ display: "flex", flexDirection: "row", width: "100%", height: "var(--ds-spacing-panel-sm)", gap: "var(--ds-spacing-1)"}}>
<div style={{ background: "var(--ds-color-background)", padding: "var(--ds-spacing-6)", borderRadius: "var(--ds-borderRadius-xl)", width: "100%", height: "100%"}}>
            <span>Background
          </span>
          </div><div style={{ background: "var(--ds-color-primary)", width: "100%", padding: "var(--ds-spacing-6)", borderRadius: "var(--ds-borderRadius-xl)", color: "var(--ds-color-primary-foreground)" }}>
            <span>Primary</span>
          </div><div style={{ background: "var(--ds-color-secondary)", width: "100%", padding: "var(--ds-spacing-6)", borderRadius: "var(--ds-borderRadius-xl)", color: "var(--ds-color-secondary-foreground)" }}>
            <span>Secondary
</span>
          </div><div style={{ background: "var(--ds-color-muted)", width: "100%", padding: "var(--ds-spacing-6)", borderRadius: "var(--ds-borderRadius-xl)" }}>
            <span style={{ color: "var(--ds-color-muted-foreground)" }}>Muted</span>
          </div>
        </div>
</div>
      <div style={{ display: "flex", gap: "var(--ds-spacing-2)", flexDirection: "column", width: "100%" }}>        <h1 style={{ fontSize: "var(--ds-spacing-text-3xl)", color: "var(--ds-color-foreground)" }}>Foreground</h1><div style={{ display: "flex", flexDirection: "row", width: "100%", height: "var(--ds-spacing-panel-sm)", gap: "var(--ds-spacing-1)"}}>
<div style={{ background: "var(--ds-color-foreground)", width: "100%", padding: "var(--ds-spacing-6)", borderRadius: "var(--ds-borderRadius-xl)", color: "var(--ds-color-background)" }}>
            <span>Foreground
        </span>
          </div><div style={{ background: "var(--ds-color-primary-foreground)", width: "100%", padding: "var(--ds-spacing-6)", borderRadius: "var(--ds-borderRadius-xl)" }}>
            <span style={{ color: "var(--ds-color-primary)" }}>Primary Foreground</span>
          </div><div style={{ background: "var(--ds-color-secondary-foreground)", width: "100%", padding: "var(--ds-spacing-6)", borderRadius: "var(--ds-borderRadius-xl)" }}>
            <span style={{ color: "var(--ds-color-secondary)" }}>Secondary
 Foreground</span>
          </div><div style={{ background: "var(--ds-color-muted-foreground)", width: "100%", padding: "var(--ds-spacing-6)", borderRadius: "var(--ds-borderRadius-xl)" }}>
            <span style={{ color: "var(--ds-color-muted)" }}>Muted Foreground</span>
          </div>
        </div>
</div>

    </main>
  );
}
