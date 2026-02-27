import type { Principal } from "@icp-sdk/core/principal";

interface PrincipalTextProps {
  principal: Principal | string;
  length?: number;
  className?: string;
}

export function PrincipalText({ principal, length = 8, className }: PrincipalTextProps) {
  const str = typeof principal === "string" ? principal : principal.toString();
  const truncated = str.length > length * 2 + 3
    ? `${str.slice(0, length)}…${str.slice(-4)}`
    : str;

  return (
    <span className={`font-mono text-xs text-muted-foreground ${className ?? ""}`} title={str}>
      {truncated}
    </span>
  );
}
