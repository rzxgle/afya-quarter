import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import type { OptionsResponse } from "../lib/types";

interface FiltersState {
  options: OptionsResponse | null;
  optionsError: string | null;

  product: string;
  cycle: string;
  projectView: string;
  selectedTeams: string[] | null; // null = todas
  onlyWithDates: boolean;

  availableTeams: string[];
  refreshNonce: number;
  refreshing: boolean;

  setProduct: (p: string) => void;
  setCycle: (c: string) => void;
  setProjectView: (v: string) => void;
  toggleTeam: (t: string) => void;
  setAllTeams: () => void;
  setNoTeams: () => void;
  setOnlyWithDates: (b: boolean) => void;
  setAvailableTeams: (t: string[]) => void;
  doRefresh: () => Promise<void>;
}

const Ctx = createContext<FiltersState | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [product, setProductState] = useState("");
  const [cycle, setCycle] = useState("");
  const [projectView, setProjectView] = useState("Todos os projetos");
  const [selectedTeams, setSelectedTeams] = useState<string[] | null>(null);
  const [onlyWithDates, setOnlyWithDates] = useState(false);

  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Carrega opções uma vez e define produto/ciclo padrão
  useEffect(() => {
    api
      .options()
      .then((opts) => {
        setOptions(opts);
        const first = opts.products[0];
        if (first) {
          setProductState(first.product);
          setCycle(first.default_cycle);
        }
      })
      .catch((e) => setOptionsError(String(e.message ?? e)));
  }, []);

  const setProduct = (p: string) => {
    setProductState(p);
    const prod = options?.products.find((x) => x.product === p);
    setCycle(prod ? prod.default_cycle : "");
    setProjectView("Todos os projetos");
    setSelectedTeams(null); // reset -> todas
  };

  const resetTeams = () => setSelectedTeams(null);

  const value: FiltersState = {
    options,
    optionsError,
    product,
    cycle,
    projectView,
    selectedTeams,
    onlyWithDates,
    availableTeams,
    refreshNonce,
    refreshing,
    setProduct,
    setCycle: (c) => {
      setCycle(c);
      resetTeams();
    },
    setProjectView: (v) => {
      setProjectView(v);
      resetTeams();
    },
    toggleTeam: (t) => {
      const base = selectedTeams ?? availableTeams;
      const next = base.includes(t)
        ? base.filter((x) => x !== t)
        : [...base, t];
      setSelectedTeams(next);
    },
    setAllTeams: () => setSelectedTeams(null),
    setNoTeams: () => setSelectedTeams([]),
    setOnlyWithDates,
    setAvailableTeams,
    doRefresh: async () => {
      setRefreshing(true);
      try {
        await api.refresh();
        setRefreshNonce((n) => n + 1);
      } finally {
        setRefreshing(false);
      }
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters(): FiltersState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilters fora do FiltersProvider");
  return ctx;
}

/** true quando a squad está marcada (null = todas marcadas) */
export function isTeamSelected(
  selectedTeams: string[] | null,
  team: string,
): boolean {
  return selectedTeams === null || selectedTeams.includes(team);
}
