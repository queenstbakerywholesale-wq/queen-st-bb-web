import { describe, it, expect } from "vitest";

describe("Product Search Feature", () => {
  it("should filter products by name (case-insensitive)", () => {
    const products = [
      { name: "Koala Mug", detail: "Ceramic mug with koala", price: 25 },
      { name: "Kangaroo Cap", detail: "Baseball cap", price: 30 },
      { name: "Wombat Eco Bag", detail: "Cotton tote bag", price: 20 },
    ];
    const query = "koala";
    const filtered = products.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.detail && item.detail.toLowerCase().includes(query.toLowerCase()))
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Koala Mug");
  });

  it("should filter products by detail/description", () => {
    const products = [
      { name: "Koala Mug", detail: "Ceramic mug with koala", price: 25 },
      { name: "Kangaroo Cap", detail: "Baseball cap", price: 30 },
      { name: "Wombat Eco Bag", detail: "Cotton tote bag", price: 20 },
    ];
    const query = "cotton";
    const filtered = products.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.detail && item.detail.toLowerCase().includes(query.toLowerCase()))
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Wombat Eco Bag");
  });

  it("should return empty array when no products match", () => {
    const products = [
      { name: "Koala Mug", detail: "Ceramic mug with koala", price: 25 },
      { name: "Kangaroo Cap", detail: "Baseball cap", price: 30 },
    ];
    const query = "unicorn";
    const filtered = products.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.detail && item.detail.toLowerCase().includes(query.toLowerCase()))
    );
    expect(filtered).toHaveLength(0);
  });

  it("should return all products when search query is empty", () => {
    const products = [
      { name: "Koala Mug", detail: "Ceramic mug", price: 25 },
      { name: "Kangaroo Cap", detail: "Baseball cap", price: 30 },
    ];
    const query = "";
    const shouldFilter = query.trim().length > 0;
    const filtered = shouldFilter
      ? products.filter(
          (item) =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            (item.detail && item.detail.toLowerCase().includes(query.toLowerCase()))
        )
      : products;
    expect(filtered).toHaveLength(2);
  });

  it("should handle category + search combined filtering", () => {
    const displayData = [
      {
        category: "Mugs",
        items: [
          { name: "Koala Mug", detail: "Ceramic mug", price: 25 },
          { name: "Bear Mug", detail: "Glass mug", price: 28 },
        ],
      },
      {
        category: "Caps",
        items: [{ name: "Koala Cap", detail: "Baseball cap", price: 30 }],
      },
    ];
    const activeCategory = "Mugs";
    const searchQuery = "koala";

    let data = displayData;
    if (activeCategory !== "All") {
      data = data.filter((d) => d.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      data = data
        .map((d) => ({
          ...d,
          items: d.items.filter(
            (item) =>
              item.name.toLowerCase().includes(q) ||
              (item.detail && item.detail.toLowerCase().includes(q))
          ),
        }))
        .filter((d) => d.items.length > 0);
    }

    expect(data).toHaveLength(1);
    expect(data[0].category).toBe("Mugs");
    expect(data[0].items).toHaveLength(1);
    expect(data[0].items[0].name).toBe("Koala Mug");
  });
});

describe("Sales Chart Data Processing", () => {
  it("should fill missing dates with 0 revenue", () => {
    const dailyRevenue = [
      { date: "2026-06-10", revenue: "50.00", orderCount: 2 },
      { date: "2026-06-12", revenue: "75.00", orderCount: 3 },
    ];

    const daily: Array<{ date: string; revenue: number; orderCount: number }> = [];
    const dates = ["2026-06-10", "2026-06-11", "2026-06-12", "2026-06-13"];
    for (const dateStr of dates) {
      const found = dailyRevenue.find((r) => r.date === dateStr);
      daily.push({
        date: dateStr,
        revenue: found ? parseFloat(found.revenue) : 0,
        orderCount: found ? found.orderCount : 0,
      });
    }

    expect(daily).toHaveLength(4);
    expect(daily[0].revenue).toBe(50);
    expect(daily[1].revenue).toBe(0); // Missing date filled with 0
    expect(daily[2].revenue).toBe(75);
    expect(daily[3].revenue).toBe(0);
  });

  it("should aggregate daily data into weekly totals", () => {
    const daily = [
      { date: "2026-06-01", revenue: 10, orderCount: 1 },
      { date: "2026-06-02", revenue: 20, orderCount: 2 },
      { date: "2026-06-03", revenue: 30, orderCount: 1 },
      { date: "2026-06-04", revenue: 0, orderCount: 0 },
      { date: "2026-06-05", revenue: 15, orderCount: 1 },
      { date: "2026-06-06", revenue: 25, orderCount: 2 },
      { date: "2026-06-07", revenue: 0, orderCount: 0 },
    ];

    const weekSlice = daily.slice(0, 7);
    const weeklyRevenue = weekSlice.reduce((sum, d) => sum + d.revenue, 0);
    const weeklyOrders = weekSlice.reduce((sum, d) => sum + d.orderCount, 0);

    expect(weeklyRevenue).toBe(100);
    expect(weeklyOrders).toBe(7);
  });

  it("should calculate max revenue correctly for chart scaling", () => {
    const chartItems = [
      { label: "2026-06-10", revenue: 50, orderCount: 2 },
      { label: "2026-06-11", revenue: 0, orderCount: 0 },
      { label: "2026-06-12", revenue: 120, orderCount: 5 },
      { label: "2026-06-13", revenue: 30, orderCount: 1 },
    ];
    const maxRevenue = Math.max(...chartItems.map((d) => d.revenue), 1);
    expect(maxRevenue).toBe(120);

    // Bar height calculation
    const height = (chartItems[2].revenue / maxRevenue) * 100;
    expect(height).toBe(100);

    const height2 = (chartItems[0].revenue / maxRevenue) * 100;
    expect(Math.round(height2 * 100) / 100).toBeCloseTo(41.67, 1);
  });

  it("should handle empty revenue data gracefully", () => {
    const chartItems: Array<{ label: string; revenue: number; orderCount: number }> = [];
    const maxRevenue = Math.max(...chartItems.map((d) => d.revenue), 1);
    expect(maxRevenue).toBe(1); // Fallback to 1 to prevent division by zero
  });
});
