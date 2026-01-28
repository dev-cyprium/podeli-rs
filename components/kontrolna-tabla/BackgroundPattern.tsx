export function BackgroundPattern() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden bg-podeli-light">
      {/* Dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#006992_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.08]" />

      {/* Ambient glows - Top Left (Accent) */}
      <div className="absolute -left-20 -top-20 h-[600px] w-[600px] rounded-full bg-podeli-accent/20 blur-[100px] mix-blend-multiply" />

      {/* Ambient glows - Bottom Right (Blue) */}
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-podeli-blue/15 blur-[100px] mix-blend-multiply" />

      {/* Center subtle highlight to keep content readable */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_100%)]" />
    </div>
  );
}
