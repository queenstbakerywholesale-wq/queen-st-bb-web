/**
 * Australia Post Shipping Calculator
 * Uses the PAC (Postage Assessment Calculator) API for real-time rates.
 * Falls back to zone-based flat rates when API is unavailable.
 */
import { ENV } from "./_core/env";

const AUSPOST_BASE_URL = "https://digitalapi.auspost.com.au";

// Queen St BB store postcode (Sydney CBD area)
const ORIGIN_POSTCODE = "2000";

// Default parcel dimensions for merchandise (cm and kg)
const DEFAULT_PARCEL = {
  length: 30,
  width: 22,
  height: 15,
  weight: 1.5,
};

// Zone-based fallback rates (AUD) when API is unavailable
const FALLBACK_RATES: Record<string, number> = {
  metro: 10.0, // Same city / metro area
  regional: 14.0, // Regional within same state
  interstate: 16.0, // Interstate metro
  remote: 22.0, // Remote / rural areas
  default: 14.0, // Catch-all
};

// Postcode zone classification (simplified Australian zones)
function classifyZone(fromPostcode: string, toPostcode: string): string {
  const fromState = getState(fromPostcode);
  const toState = getState(toPostcode);
  const toNum = parseInt(toPostcode, 10);

  // Same state
  if (fromState === toState) {
    // Metro postcodes (rough approximation)
    if (isMetro(toPostcode)) return "metro";
    return "regional";
  }

  // Remote postcodes
  if (isRemote(toPostcode)) return "remote";

  // Interstate
  return "interstate";
}

function getState(postcode: string): string {
  const num = parseInt(postcode, 10);
  if (num >= 1000 && num <= 2599) return "NSW";
  if (num >= 2619 && num <= 2899) return "NSW";
  if (num >= 2600 && num <= 2618) return "ACT";
  if (num >= 2900 && num <= 2920) return "ACT";
  if (num >= 3000 && num <= 3999) return "VIC";
  if (num >= 4000 && num <= 4999) return "QLD";
  if (num >= 5000 && num <= 5799) return "SA";
  if (num >= 6000 && num <= 6797) return "WA";
  if (num >= 7000 && num <= 7799) return "TAS";
  if (num >= 800 && num <= 899) return "NT";
  return "OTHER";
}

function isMetro(postcode: string): boolean {
  const num = parseInt(postcode, 10);
  // Sydney metro
  if (num >= 2000 && num <= 2234) return true;
  // Melbourne metro
  if (num >= 3000 && num <= 3207) return true;
  // Brisbane metro
  if (num >= 4000 && num <= 4179) return true;
  // Perth metro
  if (num >= 6000 && num <= 6199) return true;
  // Adelaide metro
  if (num >= 5000 && num <= 5199) return true;
  // Hobart metro
  if (num >= 7000 && num <= 7099) return true;
  // Canberra metro
  if (num >= 2600 && num <= 2618) return true;
  // Darwin metro
  if (num >= 800 && num <= 832) return true;
  return false;
}

function isRemote(postcode: string): boolean {
  const num = parseInt(postcode, 10);
  // NT remote
  if (num >= 850 && num <= 899) return true;
  // WA remote
  if (num >= 6700 && num <= 6797) return true;
  // QLD remote
  if (num >= 4800 && num <= 4999) return true;
  // SA remote
  if (num >= 5700 && num <= 5799) return true;
  // NSW remote
  if (num >= 2830 && num <= 2899) return true;
  return false;
}

export type ShippingQuote = {
  serviceName: string;
  serviceCode: string;
  price: number;
  estimatedDays?: string;
  source: "auspost_api" | "fallback";
};

export type ShippingCalcResult = {
  quotes: ShippingQuote[];
  selectedQuote: ShippingQuote;
  fromPostcode: string;
  toPostcode: string;
};

/**
 * Calculate shipping cost using Australia Post PAC API.
 * Falls back to zone-based rates if API is unavailable.
 */
export async function calculateShipping(
  toPostcode: string,
  parcel?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  }
): Promise<ShippingCalcResult> {
  const fromPostcode = ORIGIN_POSTCODE;
  const dims = {
    length: parcel?.length || DEFAULT_PARCEL.length,
    width: parcel?.width || DEFAULT_PARCEL.width,
    height: parcel?.height || DEFAULT_PARCEL.height,
    weight: parcel?.weight || DEFAULT_PARCEL.weight,
  };

  // Try Australia Post PAC API first
  if (ENV.auspostApiKey) {
    try {
      const apiResult = await fetchAusPostRates(fromPostcode, toPostcode, dims);
      if (apiResult && apiResult.length > 0) {
        // Sort by price ascending
        apiResult.sort((a, b) => a.price - b.price);
        return {
          quotes: apiResult,
          selectedQuote: apiResult[0], // cheapest option
          fromPostcode,
          toPostcode,
        };
      }
    } catch (err) {
      console.warn("[AusPost] API call failed, using fallback rates:", err);
    }
  }

  // Fallback to zone-based rates
  const zone = classifyZone(fromPostcode, toPostcode);
  const price = FALLBACK_RATES[zone] || FALLBACK_RATES.default;

  const fallbackQuote: ShippingQuote = {
    serviceName: "Standard Parcel",
    serviceCode: "FALLBACK_STANDARD",
    price,
    estimatedDays: zone === "metro" ? "2-4" : zone === "remote" ? "5-10" : "3-7",
    source: "fallback",
  };

  return {
    quotes: [fallbackQuote],
    selectedQuote: fallbackQuote,
    fromPostcode,
    toPostcode,
  };
}

/**
 * Fetch real-time rates from Australia Post PAC API.
 */
async function fetchAusPostRates(
  fromPostcode: string,
  toPostcode: string,
  dims: { length: number; width: number; height: number; weight: number }
): Promise<ShippingQuote[]> {
  // Step 1: Get available services
  const serviceUrl = new URL(
    "/postage/parcel/domestic/service.json",
    AUSPOST_BASE_URL
  );
  serviceUrl.searchParams.set("from_postcode", fromPostcode);
  serviceUrl.searchParams.set("to_postcode", toPostcode);
  serviceUrl.searchParams.set("length", dims.length.toString());
  serviceUrl.searchParams.set("width", dims.width.toString());
  serviceUrl.searchParams.set("height", dims.height.toString());
  serviceUrl.searchParams.set("weight", dims.weight.toString());

  const serviceResp = await fetch(serviceUrl.toString(), {
    headers: { "AUTH-KEY": ENV.auspostApiKey },
    signal: AbortSignal.timeout(8000),
  });

  if (!serviceResp.ok) {
    throw new Error(`AusPost service API returned ${serviceResp.status}`);
  }

  const serviceData = await serviceResp.json() as {
    services?: { service?: Array<{ code: string; name: string; max_extra_cover?: number }> };
  };

  const services = serviceData?.services?.service;
  if (!services || services.length === 0) return [];

  // Step 2: Calculate cost for each service
  const quotes: ShippingQuote[] = [];

  for (const svc of services) {
    try {
      const calcUrl = new URL(
        "/postage/parcel/domestic/calculate.json",
        AUSPOST_BASE_URL
      );
      calcUrl.searchParams.set("from_postcode", fromPostcode);
      calcUrl.searchParams.set("to_postcode", toPostcode);
      calcUrl.searchParams.set("length", dims.length.toString());
      calcUrl.searchParams.set("width", dims.width.toString());
      calcUrl.searchParams.set("height", dims.height.toString());
      calcUrl.searchParams.set("weight", dims.weight.toString());
      calcUrl.searchParams.set("service_code", svc.code);

      const calcResp = await fetch(calcUrl.toString(), {
        headers: { "AUTH-KEY": ENV.auspostApiKey },
        signal: AbortSignal.timeout(8000),
      });

      if (!calcResp.ok) continue;

      const calcData = await calcResp.json() as {
        postage_result?: {
          total_cost?: string;
          delivery_time?: string;
          service?: string;
        };
      };

      const result = calcData?.postage_result;
      if (result?.total_cost) {
        quotes.push({
          serviceName: result.service || svc.name,
          serviceCode: svc.code,
          price: parseFloat(result.total_cost),
          estimatedDays: result.delivery_time || undefined,
          source: "auspost_api",
        });
      }
    } catch {
      // Skip this service if calculation fails
    }
  }

  return quotes;
}

/**
 * Get a quick fallback shipping estimate without API call.
 * Used when we just need a rough estimate (e.g., cart preview).
 */
export function getQuickEstimate(toPostcode?: string): number {
  if (!toPostcode) return FALLBACK_RATES.default;
  const zone = classifyZone(ORIGIN_POSTCODE, toPostcode);
  return FALLBACK_RATES[zone] || FALLBACK_RATES.default;
}
