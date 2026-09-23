export default async function handler(req, res) {
  try {
    const token = process.env.FOOTBALL_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "FOOTBALL_API_TOKEN is not configured"
      });
    }

    const allowedLeagues = [
      "PL",
      "PD",
      "BL1",
      "SA",
      "FL1",
      "DED",
      "PPL",
      "CL"
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
      league: league,
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
