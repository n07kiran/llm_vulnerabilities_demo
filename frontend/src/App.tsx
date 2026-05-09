import { AttackerPage } from "./pages/AttackerPage";
import { HomePage } from "./pages/HomePage";
import { VulnerabilityPage } from "./pages/VulnerabilityPage";
import { usePathname } from "./utils/navigation";

export function App() {
  const pathname = usePathname();
  if (pathname === "/attacker") {
    return <AttackerPage />;
  }
  const match = pathname.match(/^\/vulnerabilities\/([^/]+)$/);

  if (match) {
    return <VulnerabilityPage slug={decodeURIComponent(match[1])} />;
  }

  return <HomePage />;
}
