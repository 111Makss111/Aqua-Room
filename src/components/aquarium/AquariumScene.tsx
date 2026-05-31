export function AquariumScene() {
  return (
    <div className="aqua-scene" aria-hidden="true">
      <div className="tank-layer tank-layer-back" />
      <div className="water-motion" />
      <div className="tank-layer tank-layer-mid" />
      <div className="bubble-geyser">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="tank-layer tank-layer-front" />
      <div className="glass-layer" />
    </div>
  );
}
