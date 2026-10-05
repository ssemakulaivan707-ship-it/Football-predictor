// api/football.js

export default async function handler(req, res) {
  // 1. Check for API Token
  const token = process.env.FOOTBALL_API_TOKEN;
  if (!token) {
    console.error("Missing FOOTBALL_API_TOKEN environment variable.");
    return res.status(500).json({
      error: "Server configuration error: FOOTBALL_API_TOKEN is not configured."
    });
  }

  try {
    // 2. Parse Query Parameters
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const league = (url.searchParams.get("league") || "PL").toUpperCase();
    const action = url.searchParams.get("action") || "matches"; // 'matches' or 'standings'

    // 3. Validate League (Updated list: Removed FL2 and CL, Added PPL and BJL)
    const allowedLeagues = [
      "PL",  // England Premier League
      "ELC", // England Championship
      "PD",  // Spain La Liga
      "SD",  // Spain Segunda Division
      "BL1", // Germany Bundesliga
      "BL2", // Germany 2. Bundesliga
      "SA",  // Italy Serie A
      "SB",  // Italy Serie B
      "FL1", // France Ligue 1
      "DED", // Netherlands Eredivisie
      "PPL", // Portugal Primeira Liga
      "BJL"  // Belgium Pro League
    ];

    if (!allowedLeagues.includes(league)) {
      return res.status(400).json({
        error: `Unsupported league: ${league}`,
        allowedLeagues: allowedLeagues
      });
    }

    // 4. Determine External API Endpoint
    let apiUrl = `https://api.football-data.org/v4/competitions/${league}/matches`;
    if (action === "standings") {
      apiUrl = `https://api.football-data.org/v4/competitions/${league}/standings`;
    }

    // 5. Fetch Data from Football-Data API
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-Auth-Token": token
      }
    });

    const data = await response.json();

    // 6. Handle External API Errors
    if (!response.ok) {
      console.error(`Football API Error (${response.status}):`, data);
      return res.status(response.status >= 400 && response.status < 500 ? 400 : 502).json({
        error: "Football API request failed",
        details: data.message || data.error || "Unknown upstream error"
      });
    }

    // 7. Set Caching Headers (Crucial for free tier rate limits)
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );

    // 8. Return Formatted Data
    if (action === "standings") {
      // Find the "TOTAL" standings table
      const totalStandings = data.standings?.find(s => s.type === "TOTAL");
      return res.status(200).json({ 
        standings: totalStandings ? totalStandings.table : [] 
      });
    }

    return res.status(200).json({
      league,
      competition: data.competition || {},
      matches: data.matches || []
    });

  } catch (error) {
    // 9. Catch Catastrophic Errors
    console.error("Internal Server Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
