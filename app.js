const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db

app.use(express.json())

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3001, () => {
      console.log('Server Running at http://localhost:3001/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertMatchDetailsDbObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

// GET ALL API
app.get('/players', async (request, response) => {
  const getPlayerQuery = `
  SELECT 
    *
  FROM 
  player_details;`
  const playerArray = await db.all(getPlayerQuery)
  response.send(
    playerArray.map(eachPlayer => convertDbObjectToResponseObject(eachPlayer)),
  )
})

// GET API
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
  SELECT 
    *
  FROM 
  player_details
  WHERE
  player_id = ${playerId};`
  const playerDetails = await db.get(getPlayerQuery)
  response.send(convertDbObjectToResponseObject(playerDetails))
})

// PUT API
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name='${playerName}'
    WHERE player_id = ${playerId};`
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

// GET API
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `
  SELECT
    *
  FROM
  match_details
  WHERE
  match_id = ${matchId};`
  const matchDetails = await db.get(getMatchQuery)
  response.send(matchDetails)
})

// GET API
app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
  SELECT
    * 
  FROM player_match_score
    NATURAL JOIN match_details
  WHERE
  player_id = ${playerId};`
  const playerMatches = await db.all(getPlayerMatchesQuery)
  response.send(
    playerMatches.map(eachMatch =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch),
    ),
  )
})

// GET API
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayerQuery = `
  SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
  FROM player_match_score
  NATURAL JOIN player_details
  WHERE match_id=${matchId};`
  const matchesPlayer = await db.all(getMatchPlayerQuery)
  response.send(matchesPlayer)
})

// GET API
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`
  const playerScore = await db.get(getPlayerScored)
  response.send(playerScore)
})

module.exports = app
