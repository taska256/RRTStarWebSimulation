import type { MetaFunction } from "@remix-run/node";
import { RRTStarCanvas } from "~/components/RRTStarCanvas";

export const meta: MetaFunction = () => {
  return [
    { title: "RRTStarSimulation" },
    { name: "description", content: "Page of RRTStar Simulation" },
  ];
};

export default function Index() {
  return <RRTStarCanvas />;
}
