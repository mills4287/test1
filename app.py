from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template("index.html")  # Serve the HTML file

# Load datasets
players_df = pd.read_csv("player_Stats.csv")  # Uses team abbreviations
teams_df = pd.read_csv("team_Stats.csv")  # Uses full team names
games_df = pd.read_csv("game_stats.csv")  # Uses full team names

# Team name mappings
team_mapping = {
    "ATL": "Atlanta Hawks", "BOS": "Boston Celtics", "BKN": "Brooklyn Nets",
    "CHA": "Charlotte Hornets", "CHI": "Chicago Bulls", "CLE": "Cleveland Cavaliers",
    "DAL": "Dallas Mavericks", "DEN": "Denver Nuggets", "DET": "Detroit Pistons",
    "GSW": "Golden State Warriors", "HOU": "Houston Rockets", "IND": "Indiana Pacers",
    "LAC": "Los Angeles Clippers", "LAL": "Los Angeles Lakers", "MEM": "Memphis Grizzlies",
    "MIA": "Miami Heat", "MIL": "Milwaukee Bucks", "MIN": "Minnesota Timberwolves",
    "NOP": "New Orleans Pelicans", "NYK": "New York Knicks", "OKC": "Oklahoma City Thunder",
    "ORL": "Orlando Magic", "PHI": "Philadelphia 76ers", "PHX": "Phoenix Suns",
    "POR": "Portland Trail Blazers", "SAC": "Sacramento Kings", "SAS": "San Antonio Spurs",
    "TOR": "Toronto Raptors", "UTA": "Utah Jazz", "WAS": "Washington Wizards"
}

# Reverse mapping for full name to abbreviation
reverse_team_mapping = {v: k for k, v in team_mapping.items()}

@app.route('/teams')
def get_teams():
    return jsonify(list(team_mapping.values()))

@app.route('/players')
def get_players():
    team_name = request.args.get('team')

    if not team_name or team_name not in reverse_team_mapping:
        return jsonify([])

    team_abbr = reverse_team_mapping[team_name]
    team_players = players_df[players_df["Team"] == team_abbr]["Player"].unique().tolist()

    return jsonify(sorted(team_players))

@app.route('/analyze_bet', methods=['POST'])
def analyze_bet():
    data = request.get_json()
    team_abbr = reverse_team_mapping.get(data['team'])
    player_name = data['player']
    stat = data['stat']
    line = data['line']
    opponent_full = data['opponent']

    if not team_abbr or player_name not in players_df["Player"].values:
        return jsonify({"error": "Invalid team or player."}), 400

    player_avg = players_df[(players_df["Team"] == team_abbr) & (players_df["Player"] == player_name)][stat].mean()
    opponent_defense = teams_df[teams_df["Team"] == opponent_full]
    opponent_drtg = opponent_defense["DRtg"].values[0]
    opponent_efg = opponent_defense["eFG%"].values[0]

    league_avg_drtg = teams_df["DRtg"].mean()
    league_avg_efg = teams_df["eFG%"].mean()

    impact = "The opponent has an average defense."
    if opponent_drtg < league_avg_drtg and opponent_efg < league_avg_efg:
        impact = "The opponent has a strong defense. Expect lower stats."
    elif opponent_drtg > league_avg_drtg and opponent_efg > league_avg_efg:
        impact = "The opponent has a weak defense. Expect better stats."

    result = {
        "player": player_name,
        "stat": stat,
        "player_avg": round(player_avg, 2),
        "assessment": "Line is too high." if line > player_avg else "Line is too low." if line < player_avg else "Line is accurate.",
        "impact": impact
    }

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
