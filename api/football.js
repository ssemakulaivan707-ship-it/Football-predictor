export default async function handler(req, res) {
  try {
    const token = process.env.FOOTBALL_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "FOOTBALL_API_TOKEN is not configured"
      });
    }

    // 12 competitions
    const allowedLeagues = [
      "PL",    // England Premier League
      "ELC",   // England Championship
      "PD",    // Spain La Liga
      "SD",    // Spain Segunda Division
      "BL1",   // Germany Bundesliga
      "BL2",   // Germany 2. Bundesliga
      "SA",    // Italy Serie A
      "SB",    // Italy Serie B
      "FL1",   // France Ligue 1
      "FL2",   // France Ligue 2
      "DED",   // Netherlands Eredivisie
      "CL"     // Champions League
    ];

    const url = new URL(
      req.url,
      "https://football-predictor-henna-tau.vercel.app"
    );

    const league = String(
      url.searchParams.get("league") || "PL"
    ).toUpperCase();

    if (!allowedLeagues.includes(league)) {
      return res.status(400).json({
        error: "Unsupported league: " + league
      });
    }

    const apiUrl =
      `https://api.football-data.org/v4/competitions/${league}/matches`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-Auth-Token": token
      },
      cache: "no-store"
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Football API request failed",
        details: data
      });
    }

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    return res.status(200).json({
      league,
      competition: data.competition || {},
      matches: data.matches || []
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
