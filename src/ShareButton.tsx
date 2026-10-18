import { useState } from "react";

// Opens the system share sheet, or copies a public link to this result.
export function ShareButton({ id, title }: { id: string; title: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const url = `${window.location.origin}/r/${id}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // dismissed or unsupported: copy instead
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("manual");
    }
  }

  return (
    <div className="share">
      <button className="primary wide" onClick={() => void share()}>
        {state === "copied" ? "链接已复制，发给朋友测测吧" : "分享我的结果"}
      </button>
      {state === "manual" && <input readOnly value={url} onFocus={(e) => e.target.select()} />}
    </div>
  );
}
