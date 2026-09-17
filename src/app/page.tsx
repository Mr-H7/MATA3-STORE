import { Gateway } from "@/components/gateway";
import { getAvailableMarkets } from "@/lib/catalogue";
export const dynamic = "force-dynamic";
export default async function Entry() { return <Gateway markets={await getAvailableMarkets()} />; }
