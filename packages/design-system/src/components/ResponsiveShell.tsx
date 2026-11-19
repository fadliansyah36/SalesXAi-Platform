import React from 'react';
type DivProps = React.HTMLAttributes<HTMLDivElement>;
export function PageShell({ className = '', ...props }: DivProps) { return <main className={`salesx-page-shell ${className}`.trim()} {...props} />; }
export function Stack({ className = '', ...props }: DivProps) { return <div className={`salesx-stack ${className}`.trim()} {...props} />; }
export function Inline({ className = '', ...props }: DivProps) { return <div className={`salesx-inline ${className}`.trim()} {...props} />; }
export function Surface({ className = '', ...props }: DivProps) { return <div className={`salesx-surface ${className}`.trim()} {...props} />; }
