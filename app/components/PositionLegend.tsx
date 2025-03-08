import { Table } from "flowbite-react";
import { legendColors } from "../data/positionColors";

export default function PositionLegend() {
  const legend = Object.keys(legendColors) as (keyof typeof legendColors)[];

  return (
    <Table className="w-auto rounded-lg border-0 bg-white shadow-lg">
      <Table.Head>
        <Table.HeadCell
          colSpan={legend.length}
          className="bg-blue-600 p-2 text-center text-sm text-white"
        >
          Position Legend
        </Table.HeadCell>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          {legend.map((legend) => (
            <Table.Cell
              key={legend}
              className="border-0 bg-transparent p-2 text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <div
                  className={`size-4 rounded`}
                  style={{ backgroundColor: legendColors[legend] }}
                />
                <span className="text-sm text-gray-700">{legend}</span>
              </div>
            </Table.Cell>
          ))}
        </Table.Row>
      </Table.Body>
    </Table>
  );
}
