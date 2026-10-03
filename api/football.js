// api/football.js
export default async function handler(req, res) {
  const token = process.env.FOOTBALL_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "FOOTBALL_API_TOKEN is not configured" });
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const league = (url.searchParams.get("league") || "PL").toUpperCase();
    const action = url.searchParams.get("action") || "matches"; // 'matches' or 'standings'

    // Validate league (keep your existing allowedLeagues array here)
    const allowedLeagues = ["PL", "ELC", "PD", "SD", "BL1", "BL2", "SA", "SB", "FL1", "FL2", "DED", "CL"];
    if (!allowedLeagues.includes(league)) {
      return res.status(400).json({ error: "Unsupported league: " + league });
    }

    // Determine the external API endpoint based on action
    let apiUrl = `https://api.football-data.org/v4/competitions/${league}/matches`;
    if (action === "standings") {
      apiUrl = `https://api.football-data.org/v4/competitions/${league}/standings`;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "X-Auth-Token": token }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Football API request failed",
        details: data.message || data.error
      });
    }

    // Cache for 60 seconds on Vercel edge
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

    if (action === "standings") {
      // Return just the table for simplicity
      const totalStandings = data.standings?.find(s => s.type === "TOTAL");
      return res.status(200).json({ standings: totalStandings ? totalStandings.table : [] });
    }

    return res.status(200).json({
      league,
      competition: data.competition || {},
      matches: data.matches || []
    });

  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
}
