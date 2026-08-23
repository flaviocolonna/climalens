export interface SelectedPlace {
  /** Stable identity so effects re-run when the point actually changes. */
  key: string;
  name: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  population?: number;
  /** Used to scope the project search; absent for map-clicked points. */
  country?: string;
  /**
   * ISO-3166 alpha-2, quando il punto arriva dalla ricerca. È l'attribuzione
   * esatta a un paese: i confini del file sono semplificati e i micro-stati non
   * ci hanno una forma, quindi dove c'è il codice il codice vince.
   */
  countryCode?: string;
  /**
   * True for a bare map click or a shared link with no place name — `name`
   * still holds a display fallback, but it's a translated label, not a real
   * place name. Callers that need to tell the two apart (e.g. deciding what to
   * send to the project-discovery search) must check this flag, never compare
   * against the fallback text itself: that text changes with the UI language.
   */
  isUnnamedPoint?: boolean;
}
