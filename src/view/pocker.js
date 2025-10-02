import { useCallback, useMemo, useState } from "react";
import { Button, Col, Container, Form, Row, Stack } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const INITIAL_STACK = 2000;
const BIG_BLIND = 100;
const SMALL_BLIND = 50;

const deepCloneRoundData = (entries) =>
  entries.map((entry) => ({
    ...entry,
    history: [...entry.history],
  }));

const getNextActivePlayerId = (players, startId) => {
  if (!players.length) {
    return null;
  }

  const firstActive = players.find((player) => player.isActive);
  if (!firstActive) {
    return null;
  }

  const startIndex = startId == null
    ? players.findIndex((player) => player.id === firstActive.id)
    : players.findIndex((player) => player.id === startId);

  if (startIndex === -1) {
    return firstActive.id;
  }

  for (let offset = 1; offset <= players.length; offset += 1) {
    const candidate = players[(startIndex + offset) % players.length];
    if (candidate.isActive) {
      return candidate.id;
    }
  }

  return firstActive.id;
};

const getNextInHandPlayerId = (roundData, players, startId) => {
  if (!players.length) {
    return null;
  }

  const roundEntries = new Map(roundData.map((entry) => [entry.playerId, entry]));
  const firstInHand = players.find(
    (player) => player.isActive && roundEntries.get(player.id)?.isInHand,
  );

  if (!firstInHand) {
    return null;
  }

  const playerOrder = new Map(players.map((player, index) => [player.id, index]));
  const startIndex = startId == null ? playerOrder.get(firstInHand.id) : playerOrder.get(startId);

  if (startIndex == null) {
    return firstInHand.id;
  }

  for (let offset = 1; offset <= players.length; offset += 1) {
    const candidate = players[(startIndex + offset) % players.length];
    const entry = roundEntries.get(candidate.id);
    if (candidate.isActive && entry?.isInHand) {
      return candidate.id;
    }
  }

  return firstInHand.id;
};

const buildRoundData = (players, blinds) =>
  players.map((player) => {
    const isBigBlind = player.id === blinds.bigBlindId;
    const isSmallBlind = player.id === blinds.smallBlindId;

    return {
      playerId: player.id,
      name: player.name,
      contribution: isBigBlind ? BIG_BLIND : isSmallBlind ? SMALL_BLIND : 0,
      history: isBigBlind ? [BIG_BLIND] : [],
      isInHand: player.isActive,
    };
  });

const playerColorStyle = (isActive) => ({ color: isActive ? "blue" : "red" });

function Pocker() {
  const [players, setPlayers] = useState([]);
  const [roundState, setRoundState] = useState({
    bigBlindId: null,
    smallBlindId: null,
    currentPlayerId: null,
  });
  const [roundData, setRoundData] = useState([]);
  const [roundHistory, setRoundHistory] = useState([]);
  const [winnerSelections, setWinnerSelections] = useState([]);
  const [currentCallAmount, setCurrentCallAmount] = useState(BIG_BLIND);
  const [raiseIncrement, setRaiseIncrement] = useState(String(BIG_BLIND));
  const [newPlayerName, setNewPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const currentPlayer = useMemo(
    () => players.find((player) => player.id === roundState.currentPlayerId),
    [players, roundState.currentPlayerId],
  );
  const bigBlindPlayer = useMemo(
    () => players.find((player) => player.id === roundState.bigBlindId),
    [players, roundState.bigBlindId],
  );
  const smallBlindPlayer = useMemo(
    () => players.find((player) => player.id === roundState.smallBlindId),
    [players, roundState.smallBlindId],
  );
  const canUndo = roundHistory.length > 1;
  const selectedWinnerCount = winnerSelections.filter(Boolean).length;

  const commitRoundState = useCallback(
    (nextData, nextCallAmount, nextCurrentPlayerId) => {
      const snapshot = {
        contributions: deepCloneRoundData(nextData),
        currentCallAmount: nextCallAmount,
        currentPlayerId: nextCurrentPlayerId,
      };

      setRoundData(nextData);
      setCurrentCallAmount(nextCallAmount);
      setRoundState((previous) => ({
        ...previous,
        currentPlayerId: nextCurrentPlayerId,
      }));
      setRoundHistory((previous) => [...previous, snapshot]);
    },
    [],
  );

  const handleAddPlayer = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      const trimmedName = newPlayerName.trim();
      if (!trimmedName) {
        return;
      }

      setPlayers((previous) => {
        const nextId = previous.length + 1;
        return [
          ...previous,
          {
            id: nextId,
            name: trimmedName,
            isActive: true,
            stack: INITIAL_STACK,
            stackHistory: [INITIAL_STACK],
          },
        ];
      });
      setWinnerSelections((previous) => [...previous, false]);
      setNewPlayerName("");
    },
    [newPlayerName],
  );

  const handleStartGame = useCallback(() => {
    if (gameStarted || players.length < 2) {
      return;
    }

    const initialRoundState = {
      bigBlindId: players[0].id,
      smallBlindId: players[1].id,
    };

    const initialRoundData = buildRoundData(players, initialRoundState);
    const nextCurrentPlayerId =
      getNextInHandPlayerId(initialRoundData, players, initialRoundState.smallBlindId) ??
      initialRoundState.smallBlindId;

    setRoundState({
      ...initialRoundState,
      currentPlayerId: nextCurrentPlayerId,
    });
    setRoundData(initialRoundData);
    setCurrentCallAmount(BIG_BLIND);
    setRoundHistory([
      {
        contributions: deepCloneRoundData(initialRoundData),
        currentCallAmount: BIG_BLIND,
        currentPlayerId: nextCurrentPlayerId,
      },
    ]);
    setWinnerSelections(new Array(players.length).fill(false));
    setRaiseIncrement(String(BIG_BLIND));
    setGameStarted(true);
  }, [gameStarted, players]);

  const handleToggleWinner = useCallback((index, checked) => {
    setWinnerSelections((previous) => {
      const next = [...previous];
      next[index] = checked;
      return next;
    });
  }, []);

  const moveToNextPlayer = useCallback(
    (nextRoundData, fallbackId) =>
      getNextInHandPlayerId(nextRoundData, players, fallbackId) ?? fallbackId,
    [players],
  );

  const handleFold = useCallback(() => {
    if (!roundState.currentPlayerId) {
      return;
    }

    const nextData = roundData.map((entry) => {
      if (entry.playerId !== roundState.currentPlayerId) {
        return entry;
      }

      const history = [...entry.history];
      let contribution = entry.contribution;

      if (history.length) {
        const last = history[history.length - 1];
        if (last > contribution) {
          contribution = last;
        } else if (last < contribution) {
          history.push(contribution);
        }
      }

      return {
        ...entry,
        contribution,
        history,
        isInHand: false,
      };
    });

    const nextPlayerId = moveToNextPlayer(nextData, roundState.currentPlayerId);
    commitRoundState(nextData, currentCallAmount, nextPlayerId);
  }, [commitRoundState, currentCallAmount, moveToNextPlayer, roundData, roundState.currentPlayerId]);

  const handleCall = useCallback(() => {
    if (!roundState.currentPlayerId) {
      return;
    }

    const nextData = roundData.map((entry) => {
      if (entry.playerId !== roundState.currentPlayerId) {
        return entry;
      }

      const history = entry.history.length
        ? entry.history[entry.history.length - 1] === currentCallAmount
          ? [...entry.history]
          : [...entry.history, currentCallAmount]
        : [currentCallAmount];

      return {
        ...entry,
        contribution: currentCallAmount,
        history,
      };
    });

    const nextPlayerId = moveToNextPlayer(nextData, roundState.currentPlayerId);
    commitRoundState(nextData, currentCallAmount, nextPlayerId);
  }, [commitRoundState, currentCallAmount, moveToNextPlayer, roundData, roundState.currentPlayerId]);

  const handleAllIn = useCallback(() => {
    if (!roundState.currentPlayerId) {
      return;
    }

    const player = players.find((candidate) => candidate.id === roundState.currentPlayerId);
    if (!player) {
      return;
    }

    const newCallAmount = player.stack;
    const nextData = roundData.map((entry) => {
      if (entry.playerId !== roundState.currentPlayerId) {
        return entry;
      }

      const history = [...entry.history, newCallAmount];

      return {
        ...entry,
        contribution: newCallAmount,
        history,
      };
    });

    const nextPlayerId = moveToNextPlayer(nextData, roundState.currentPlayerId);
    commitRoundState(nextData, newCallAmount, nextPlayerId);
    setRaiseIncrement(String(BIG_BLIND));
  }, [commitRoundState, moveToNextPlayer, players, roundData, roundState.currentPlayerId]);

  const handleRaise = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!roundState.currentPlayerId) {
        return;
      }

      const raiseValue = Number(raiseIncrement);
      if (!Number.isFinite(raiseValue) || raiseValue <= 0) {
        return;
      }

      const player = players.find((candidate) => candidate.id === roundState.currentPlayerId);
      if (!player) {
        return;
      }

      const nextCallAmount = currentCallAmount + raiseValue;
      if (nextCallAmount > player.stack) {
        return;
      }

      const nextData = roundData.map((entry) => {
        if (entry.playerId !== roundState.currentPlayerId) {
          return entry;
        }

        return {
          ...entry,
          contribution: nextCallAmount,
          history: [...entry.history, nextCallAmount],
        };
      });

      const nextPlayerId = moveToNextPlayer(nextData, roundState.currentPlayerId);
      commitRoundState(nextData, nextCallAmount, nextPlayerId);
      setRaiseIncrement(String(BIG_BLIND));
    },
    [commitRoundState, currentCallAmount, moveToNextPlayer, players, raiseIncrement, roundData, roundState.currentPlayerId],
  );

  const handleUndo = useCallback(() => {
    setRoundHistory((previous) => {
      if (previous.length <= 1) {
        return previous;
      }

      const nextHistory = previous.slice(0, -1);
      const snapshot = nextHistory[nextHistory.length - 1];

      setRoundData(deepCloneRoundData(snapshot.contributions));
      setCurrentCallAmount(snapshot.currentCallAmount);
      setRoundState((prev) => ({
        ...prev,
        currentPlayerId: snapshot.currentPlayerId,
      }));

      return nextHistory;
    });
  }, []);

  const handleCompleteRound = useCallback(() => {
    if (!gameStarted || selectedWinnerCount === 0) {
      return;
    }

    const totalPot = roundData.reduce((sum, entry) => sum + entry.contribution, 0);
    const roundDataById = new Map(roundData.map((entry) => [entry.playerId, entry]));
    const share = Math.floor(totalPot / selectedWinnerCount);

    setPlayers((previousPlayers) => {
      const updatedPlayers = previousPlayers.map((player, index) => {
        const contribution = roundDataById.get(player.id)?.contribution ?? 0;
        const isWinner = !!winnerSelections[index];
        const nextStack = isWinner
          ? player.stack + share - contribution
          : player.stack - contribution;
        const isActive = nextStack > 0;

        return {
          ...player,
          isActive,
          stack: nextStack,
          stackHistory: [...player.stackHistory, nextStack],
        };
      });

      const nextBigBlindId =
        getNextActivePlayerId(updatedPlayers, roundState.bigBlindId) ??
        updatedPlayers.find((player) => player.isActive)?.id ??
        null;
      const nextSmallBlindId =
        getNextActivePlayerId(updatedPlayers, roundState.smallBlindId) ?? nextBigBlindId;
      const seededRoundState = {
        bigBlindId: nextBigBlindId,
        smallBlindId: nextSmallBlindId,
      };
      const nextRoundData = buildRoundData(updatedPlayers, seededRoundState);
      const nextCurrentPlayerId =
        getNextInHandPlayerId(nextRoundData, updatedPlayers, nextSmallBlindId) ?? nextSmallBlindId;

      setRoundState({
        bigBlindId: nextBigBlindId,
        smallBlindId: nextSmallBlindId,
        currentPlayerId: nextCurrentPlayerId,
      });
      setRoundData(nextRoundData);
      setCurrentCallAmount(BIG_BLIND);
      setRoundHistory([
        {
          contributions: deepCloneRoundData(nextRoundData),
          currentCallAmount: BIG_BLIND,
          currentPlayerId: nextCurrentPlayerId,
        },
      ]);
      setWinnerSelections(new Array(updatedPlayers.length).fill(false));
      setRaiseIncrement(String(BIG_BLIND));

      return updatedPlayers;
    });
  }, [gameStarted, roundData, roundState.bigBlindId, roundState.smallBlindId, selectedWinnerCount, winnerSelections]);

  const toggleTable = useCallback(() => {
    setShowTable((previous) => !previous);
  }, []);

  const handleRaiseInputChange = useCallback((event) => {
    setRaiseIncrement(event.target.value);
  }, []);

  const canPerformActions = gameStarted && !!roundState.currentPlayerId;

  return (
    <Container>
      <Row className="md">
        <Col md="5">
          <Row className="md">
            <Button
              variant="danger"
              disabled={gameStarted || players.length < 2}
              onClick={handleStartGame}
            >
              Game Start
            </Button>
          </Row>
          {!gameStarted && (
            <Row className="md">
              <Form onSubmit={handleAddPlayer}>
                <Stack direction="horizontal" gap="2">
                  <Form.Label>Name</Form.Label>
                  <Form.Text className="text-muted">Add at least two players</Form.Text>
                </Stack>
                <Stack direction="horizontal" gap="3">
                  <Form.Control
                    className="me-auto"
                    type="text"
                    value={newPlayerName}
                    onChange={(event) => setNewPlayerName(event.target.value)}
                  />
                  <Button variant="primary" type="submit">
                    Submit
                  </Button>
                </Stack>
              </Form>
            </Row>
          )}
          <Row>
            <Col>Name</Col>
            <Col>Points</Col>
          </Row>
          {players.map((player) => (
            <Row className="md border bg-light" key={player.id}>
              <Col style={playerColorStyle(player.isActive)}>{player.name}</Col>
              <Col>{player.stack}</Col>
            </Row>
          ))}
        </Col>
        <Col md="1" />
        <Col md="6">
          <Row className="md">
            <Button
              variant="dark"
              disabled={!canPerformActions || selectedWinnerCount === 0}
              onClick={handleCompleteRound}
            >
              Done
            </Button>
          </Row>

          <h3>Current Player: {currentPlayer?.name ?? "-"}</h3>
          <p>Big: {bigBlindPlayer?.name ?? "-"}</p>
          <p>Small: {smallBlindPlayer?.name ?? "-"}</p>

          <Stack direction="vertical" gap="2">
            <Stack direction="horizontal" gap="4">
              <Button variant="primary" disabled={!canPerformActions} onClick={handleFold}>
                Fold
              </Button>
              <Button variant="primary" disabled={!canPerformActions} onClick={handleCall}>
                Call
              </Button>
              <Button variant="primary" disabled={!canPerformActions} onClick={handleAllIn}>
                ALL IN
              </Button>
              <Button variant="primary" disabled={!canUndo} onClick={handleUndo}>
                Undo
              </Button>
            </Stack>

            <Form onSubmit={handleRaise}>
              <Stack direction="horizontal" gap="1">
                <Button variant="primary" type="submit" disabled={!canPerformActions}>
                  Increase
                </Button>
                <Form.Group controlId="raiseValue">
                  <Form.Control
                    type="number"
                    value={raiseIncrement}
                    onChange={handleRaiseInputChange}
                  />
                </Form.Group>
              </Stack>
            </Form>

            <Container>
              {roundData.map((entry) => {
                const player = players.find((candidate) => candidate.id === entry.playerId);
                if (!player || !player.isActive) {
                  return null;
                }

                const selectionIndex = player.id - 1;

                return (
                  <Row className="border" key={entry.playerId}>
                    <Col md={{ span: 4, offset: 0 }}>
                      <Row>
                        <Stack direction="horizontal" gap="2">
                          <Col md={{ span: 1, offset: 0 }}>
                            <Form.Check
                              type="checkbox"
                              id={`winner-${entry.playerId}`}
                              checked={winnerSelections[selectionIndex] ?? false}
                              onChange={(event) =>
                                handleToggleWinner(selectionIndex, event.target.checked)
                              }
                            />
                          </Col>
                          <Col md={{ span: 2, offset: 1 }}>
                            <span style={playerColorStyle(entry.isInHand)}>{entry.name}</span>
                          </Col>
                        </Stack>
                      </Row>
                    </Col>
                    {entry.history.map((value, index) => (
                      <Col key={`${entry.playerId}-${index}`}>{value}</Col>
                    ))}
                  </Row>
                );
              })}
            </Container>
          </Stack>
        </Col>
      </Row>
      <Row>
        <Button variant="light" onClick={toggleTable}>
          Table
        </Button>
      </Row>

      {showTable && (
        <Row className="md">
          {players.map((player) => (
            <Col key={player.id} className="border">
              <Row className="border" style={{ color: "green" }}>
                {player.name}
              </Row>
              {player.stackHistory.map((point, index) => (
                <Row key={`${player.id}-history-${index}`}>{point}</Row>
              ))}
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default Pocker;
