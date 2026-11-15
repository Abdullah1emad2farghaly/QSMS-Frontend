/** Placeholder block shown while data loads. Decorative: the surrounding region carries aria-busy. */
export function Skeleton({ height = '1rem', width = '100%' }: { height?: string; width?: string }) {
  return <span className="skeleton" aria-hidden="true" style={{ blockSize: height, inlineSize: width }} />;
}
