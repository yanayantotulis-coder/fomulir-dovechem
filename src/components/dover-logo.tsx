import doverLogoAsset from "@/assets/dover-logo.png.asset.json";

const doverLogoUrl = doverLogoAsset.url;

export function DoverLogo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <img
      src={doverLogoUrl}
      alt="Logo PT. Dover Chemical"
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}
