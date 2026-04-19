export type CountryOption = {
  code: string;
  name: string;
  phoneCode: string;
};

export type PhoneCodeOption = {
  code: string;
  label: string;
};

export type LanguageOption = {
  code: string;
  label: string;
};

const FALLBACK_COUNTRIES: CountryOption[] = [
  { code: "US", name: "United States", phoneCode: "+1" },
  { code: "GB", name: "United Kingdom", phoneCode: "+44" },
  { code: "IN", name: "India", phoneCode: "+91" },
  { code: "NG", name: "Nigeria", phoneCode: "+234" },
  { code: "AE", name: "United Arab Emirates", phoneCode: "+971" },
  { code: "BR", name: "Brazil", phoneCode: "+55" },
  { code: "CA", name: "Canada", phoneCode: "+1" },
  { code: "DE", name: "Germany", phoneCode: "+49" },
  { code: "FR", name: "France", phoneCode: "+33" },
  { code: "ZA", name: "South Africa", phoneCode: "+27" },
];

function safeSupportedValuesOf(key: string): string[] {
  const intlWithValues = Intl as typeof Intl & {
    supportedValuesOf?: (supportedKey: string) => string[];
  };

  if (typeof intlWithValues.supportedValuesOf !== "function") {
    return [];
  }

  try {
    return intlWithValues.supportedValuesOf(key);
  } catch {
    return [];
  }
}

export function getTimezoneOptions(): string[] {
  const values = safeSupportedValuesOf("timeZone");
  if (!values.length) {
    return ["UTC"];
  }
  return values.sort((a, b) => a.localeCompare(b));
}

export function getLanguageOptions(locale: string): LanguageOption[] {
  const codes = safeSupportedValuesOf("language");
  const unique = new Set<string>();
  const display = new Intl.DisplayNames([locale], { type: "language" });

  const results: LanguageOption[] = [];

  const sourceCodes = codes.length ? codes : ["en", "es", "fr", "de", "pt", "ar", "hi", "zh", "ja", "ru"];

  for (const code of sourceCodes) {
    const normalized = code.toLowerCase();
    if (unique.has(normalized)) {
      continue;
    }
    unique.add(normalized);

    const label = display.of(code) || code;
    results.push({ code, label });
  }

  return results.sort((a, b) => a.label.localeCompare(b.label));
}

function extractPhoneCode(idd?: { root?: string; suffixes?: string[] }): string {
  if (!idd?.root) {
    return "";
  }

  const firstSuffix = idd.suffixes?.[0] || "";
  return `${idd.root}${firstSuffix}`;
}

export async function fetchCountryAndPhoneOptions(locale: string): Promise<{
  countries: CountryOption[];
  phoneCodes: PhoneCodeOption[];
}> {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2,idd");
    if (!response.ok) {
      throw new Error("Failed to load country options");
    }

    const raw = (await response.json()) as Array<{
      cca2?: string;
      name?: { common?: string };
      idd?: { root?: string; suffixes?: string[] };
    }>;

    const regionDisplay = new Intl.DisplayNames([locale], { type: "region" });

    const countries: CountryOption[] = raw
      .map((item) => {
        const code = item.cca2 || "";
        if (!code) {
          return null;
        }

        const localizedName = regionDisplay.of(code) || item.name?.common || code;
        return {
          code,
          name: localizedName,
          phoneCode: extractPhoneCode(item.idd),
        };
      })
      .filter((item): item is CountryOption => Boolean(item))
      .sort((a, b) => a.name.localeCompare(b.name));

    const phoneCodeMap = new Map<string, PhoneCodeOption>();
    for (const country of countries) {
      if (!country.phoneCode) {
        continue;
      }
      if (!phoneCodeMap.has(country.phoneCode)) {
        phoneCodeMap.set(country.phoneCode, {
          code: country.phoneCode,
          label: `${country.phoneCode} (${country.name})`,
        });
      }
    }

    const phoneCodes = [...phoneCodeMap.values()].sort((a, b) => a.code.localeCompare(b.code));

    if (!countries.length || !phoneCodes.length) {
      throw new Error("No country options");
    }

    return { countries, phoneCodes };
  } catch {
    const countries = [...FALLBACK_COUNTRIES];
    const phoneCodes = countries.map((country) => ({
      code: country.phoneCode,
      label: `${country.phoneCode} (${country.name})`,
    }));

    return { countries, phoneCodes };
  }
}
