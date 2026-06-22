export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Go back",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  const toneColor = tone === "warning" ? "#f59e0b" : tone === "success" ? "#10b981" : "#ef4444"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        backgroundColor: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={event => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "430px",
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "14px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "18px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              backgroundColor: `${toneColor}22`,
              border: `1px solid ${toneColor}55`,
              color: toneColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "800",
              flexShrink: 0,
            }}
          >
            !
          </div>
          <div>
            <h3 id="confirm-modal-title" style={{ color: "#ffffff", fontSize: "20px", fontWeight: "800", margin: "0 0 8px" }}>
              {title}
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "22px" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "11px 16px",
              backgroundColor: "transparent",
              color: "#94a3b8",
              border: "1px solid #334155",
              borderRadius: "9px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "11px 16px",
              backgroundColor: toneColor,
              color: "#ffffff",
              border: "none",
              borderRadius: "9px",
              fontSize: "14px",
              fontWeight: "800",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
