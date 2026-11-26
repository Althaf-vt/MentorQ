import { Card } from '../Card/Card';

export type SkeletonProps = {
  variant: 'table' | 'card' | 'ticket' | 'list';
  label?: string;
  rows?: number;
};

function Bone({ shape = 'line', width }: {
  shape?: 'line' | 'stamp' | 'pill' | 'image';
  width?: string;
}) {
  return <span className="mqds-skeleton-bone" data-shape={shape} style={{ width }} />;
}

export function Skeleton({ variant, label = 'Loading', rows = 3 }: SkeletonProps) {
  return (
    <div className="mqds-skeleton" data-variant={variant}>
      <span className="mqds-skeleton-status" role="status">{label}</span>
      <div aria-hidden="true">
        {variant === 'card' && (
          <Card className="mqds-skeleton-card">
            <Bone shape="image" />
            <Bone width="68%" />
            <Bone width="90%" />
            <Bone shape="pill" width="38%" />
          </Card>
        )}
        {variant === 'ticket' && (
          <Card variant="ticket" className="mqds-skeleton-ticket"
            stub={<><Bone width="65%" /><Bone width="85%" /></>}>
            <Bone shape="stamp" />
            <div className="mqds-skeleton-lines">
              <Bone width="52%" />
              <Bone width="91%" />
              <Bone shape="pill" width="39%" />
            </div>
          </Card>
        )}
        {(variant === 'table' || variant === 'list') && (
          <div className="mqds-skeleton-rows">
            {Array.from({ length: rows }, (_, index) => (
              <div className="mqds-skeleton-row" key={index}>
                <Bone shape="stamp" />
                <div className="mqds-skeleton-lines">
                  <Bone width={index % 2 ? '52%' : '72%'} />
                  {variant === 'list' && <Bone width={index % 2 ? '75%' : '87%'} />}
                </div>
                {variant === 'table' && <Bone width="100%" />}
                <Bone shape="pill" width="100%" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
