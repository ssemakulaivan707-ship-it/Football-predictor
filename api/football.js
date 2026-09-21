
export default async function handler(req, res) {
  try {
    const token = process.env.FOOTBALL_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "FOOTBALL_API_TOKEN is not configured"
      });
    }

    const response = await fetch(
      "https://api.football-data.org/v4/competitions/PL/matches",
      {
        headers: {
          "X-Auth-Token": token
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Football API request failed",
        details: data
      });
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
