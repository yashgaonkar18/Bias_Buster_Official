"use client";

import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

type Props = {
  title: string;
  status: boolean | string;
};

export default function StatusCard({
  title,
  status,
}: Props) {

  const getIcon = () => {
    if (status === true) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }

    if (status === "pending") {
      return <Clock className="w-5 h-5 text-yellow-600" />;
    }

    if (status === "error") {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }

    return <AlertTriangle className="w-5 h-5 text-orange-600" />;
  };

  return (
    <div className="border rounded-lg p-4 bg-white flex items-center gap-3 shadow-sm">

      {getIcon()}

      <div>
        <div className="text-sm font-semibold">
          {title}
        </div>

        <div className="text-xs text-gray-500">
          {status === true ? "Successful" : String(status)}
        </div>
      </div>
    </div>
  );
}