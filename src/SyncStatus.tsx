import { useSync } from "./tinybase-hooks";

export const SyncStatus = () => {
  const { syncStatus } = useSync();

  const getStatusColor = () => {
    switch (syncStatus) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      default:
        return "text-red-500";
    }
  };

  const getStatusDot = () => {
    return "●";
  };

  return (
    <div className="flex items-center">
      <span className={`${getStatusColor()} text-lg`}>{getStatusDot()}</span>
    </div>
  );
};
