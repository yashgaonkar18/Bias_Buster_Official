"use client";

export default function GroupImpactTable({
  selectionRate,
  tpr,
}: any) {

  return (
    <table className="min-w-full text-sm border mt-4">

      <thead className="bg-gray-100">
        <tr>
          <th className="px-3 py-2 text-left">
            Group
          </th>

          <th className="px-3 py-2 text-center">
            Selection Rate
          </th>

          <th className="px-3 py-2 text-center">
            TPR
          </th>

          <th className="px-3 py-2 text-center">
            Impact
          </th>
        </tr>
      </thead>

      <tbody>
        {Object.keys(selectionRate).map((group) => {

          const sr = selectionRate[group];

          const impact =
            sr < 0.1
              ? "Severely Disadvantaged"
              : sr < 0.2
              ? "Moderate Bias"
              : "Fair";

          return (
            <tr
              key={group}
              className={
                impact !== "Fair"
                  ? "bg-red-50"
                  : ""
              }
            >
              <td className="px-3 py-2 font-medium">
                {group}
              </td>

              <td className="px-3 py-2 text-center">
                {sr.toFixed(3)}
              </td>

              <td className="px-3 py-2 text-center">
                {tpr?.[group]?.toFixed(3) ?? "-"}
              </td>

              <td className="px-3 py-2 text-center font-semibold">
                {impact}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}