export default function StageBadge({ stage }) {
  return <span className={`badge badge-${stage.toLowerCase()}`}>{stage}</span>;
}
