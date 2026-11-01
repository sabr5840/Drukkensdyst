
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

/**
 * =====================================================
 * COLORS
 * =====================================================
 */

const COLORS = {
  background: "#F8F3EF",
  navy: "#0B2B57",
  blue: "#14558A",
  lightBlue: "#DCEAF5",
  white: "#FFFFFF",
  muted: "#6580A0",
  track: "#E6E9EC",
};

/**
 * =====================================================
 * IMAGE CONFIGURATION
 * =====================================================
 */

const API_URL = "http://10.0.0.28:3000";

function getPhoto(player) {
  if (!player) return null;

  const photo =
    player.profileImage ||
    player.profilePicture ||
    player.avatar ||
    player.photo ||
    player.image;

  if (!photo) return null;

  if (typeof photo === "string") {
    if (
      photo.startsWith("file:") ||
      photo.startsWith("content:") ||
      photo.startsWith("data:")
    ) {
      return { uri: photo };
    }

    const filename = photo
      .split("?")[0]
      .split("/")
      .pop();

    return {
      uri: `${API_URL}/uploads/${filename}`,
    };
  }

  if (typeof photo === "object") {
    return photo;
  }

  return null;
}

/**
 * =====================================================
 * PLAYER PHOTO
 * =====================================================
 *
 * Genbruges til:
 * - Afstemning
 * - Resultater
 * - Billeder af dem, der har stemt
 */

function PlayerPhoto({
  player,
  size = 94,
  selected = false,
}) {
  const photo = getPhoto(player);

  const borderWidth = selected ? 3 : 0;
  const outerSize = size + 8;

  return (
    <View
      style={[
        styles.photoOuter,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          borderWidth,
          borderColor: selected
            ? COLORS.blue
            : "transparent",
        },
      ]}
    >
      {photo ? (
        <Image
          source={photo}
          resizeMode="cover"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <View
          style={[
            styles.photoFallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Text style={styles.photoInitial}>
            {(player?.name || "?")
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * =====================================================
 * GAME HEADER
 * =====================================================
 */

function GameHeader() {
  return (
    <View style={styles.header}>
      <Image
        source={require(
          "../../assets/Hvem-er-mest-tilbøjelig-til.png"
        )}
        style={styles.headerLogo}
        resizeMode="contain"
      />
    </View>
  );
}

/**
 * =====================================================
 * BACKGROUND DECORATIONS
 * =====================================================
 */

function BackgroundDecorations() {
  return (
    <>
      <View style={styles.decorationRight} />
      <View style={styles.decorationBottom} />
    </>
  );
}

/**
 * =====================================================
 * VOTING SCREEN
 * =====================================================
 */

function VotingScreen({
  card,
  players = [],
  selectedVote,
  onVote,
}) {
  const { width } = useWindowDimensions();

  const question =
    typeof card === "string"
      ? card
      : card?.text || card?.question || "";

  const columns = 3;
  const horizontalPadding = 10;

  const gridWidth = Math.max(
    0,
    width - horizontalPadding * 2
  );

  const columnGap = 20;

  const itemWidth =
    (gridWidth - columnGap * (columns - 1)) / columns;

  const photoSize = Math.min(
    100,
    Math.max(64, itemWidth - 19)
  );

  return (
    <ScrollView
      style={styles.votingScroll}
      contentContainerStyle={styles.votingContent}
      showsVerticalScrollIndicator={false}
    >
      {/* QUESTION */}

      <View style={styles.questionBox}>
        <Text style={styles.questionText}>
          {question}
        </Text>
      </View>

      {/* PLAYERS */}

      <View
        style={[
          styles.playerGrid,
          { width: gridWidth },
        ]}
      >
        {players.map((player, index) => {
          const selected =
            selectedVote != null &&
            String(selectedVote) ===
              String(player.id);

          return (
            <Pressable
              key={String(player.id ?? index)}
              style={[
                styles.playerItem,
                { width: itemWidth },
              ]}
              onPress={() => {
                if (selectedVote == null) {
                  onVote?.(player.id);
                }
              }}
              disabled={selectedVote != null}
            >
              <PlayerPhoto
                player={player}
                size={photoSize}
                selected={selected}
              />

              <Text
                style={[
                  styles.playerName,
                  selected && styles.selectedName,
                ]}
                numberOfLines={1}
              >
                {player.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

/**
 * =====================================================
 * WAITING SCREEN
 * =====================================================
 */

function WaitingScreen({
  votedCount = 0,
  totalCount = 0,
}) {
  const count = Math.max(
    0,
    Number(totalCount) || 0
  );

  const voted = Math.min(
    count,
    Math.max(0, Number(votedCount) || 0)
  );

  return (
    <View style={styles.waitingContent}>
      <View style={styles.waitingIcons}>
        {Array.from({ length: count }).map(
          (_, index) => (
            <View
              key={index}
              style={[
                styles.waitingPerson,
                index < voted
                  ? styles.waitingPersonActive
                  : styles.waitingPersonInactive,
              ]}
            >
              <View style={styles.waitingHead} />
              <View style={styles.waitingBody} />
            </View>
          )
        )}
      </View>

      <Text style={styles.waitingCount}>
        {voted} ud af {count} har stemt
      </Text>

      <Text style={styles.waitingSubtitle}>
        Venter på de andre spillere...
      </Text>
    </View>
  );
}

/**
 * =====================================================
 * RESULTS SCREEN
 * =====================================================
 *
 * Top 3 vises efter afstemningen.
 *
 * Førsteplads:
 * - Blå baggrund
 * - Hvidt navn
 * - Hvidt stemmetal
 * - Hvid procent
 * - Hvid resultatbjælke
 * - Hvid placeringscirkel med blåt tal
 *
 * Anden- og tredjeplads:
 * - Hvid baggrund
 * - Blå tekst og resultatbjælke
 */


/**
 * =====================================================
 * RESULTS SCREEN
 * =====================================================
 *
 * Viser de 3 spillere med flest stemmer.
 *
 * Når stemmegivere vises:
 * - Maksimalt 3 profilbilleder pr. række
 * - Alle stemmegivere vises
 * - Resultatkortet udvider sig automatisk
 * - Navn, stort profilbillede og procent
 *   bliver på deres faste pladser
 */


/**
 * =====================================================
 * RESULTS SCREEN
 * =====================================================
 *
 * Viser top 3 efter afstemningen.
 *
 * Layout:
 * - Placering til venstre
 * - Stort profilbillede ved siden af
 * - Navn øverst
 * - Procent øverst til højre
 * - Stemmegivere under navnet
 * - Maksimalt 3 stemmegivere pr. række
 * - Kortet vokser automatisk i højden
 */

function ResultsScreen({
  results = [],
  players = [],
  showVoters = false,
}) {
  const { width } = useWindowDimensions();

  const sortedResults = [...results]
    .sort(
      (a, b) =>
        (Number(b.votes) || 0) -
        (Number(a.votes) || 0)
    )
    .slice(0, 3);

  const totalVotes = results.reduce(
    (sum, item) =>
      sum + (Number(item.votes) || 0),
    0
  );

  // Tilpasser billederne til telefonens bredde.
  // Vi bevarer 3 billeder pr. række.
  const cardWidth = width - 48;
  const cardInnerWidth = cardWidth - 24;

  const rankWidth = 37;
  const mainPhotoWidth = 84;
  const percentageWidth = 54;
  const informationPadding = 18;

  const availableWidth = Math.max(
    0,
    cardInnerWidth -
      rankWidth -
      mainPhotoWidth -
      percentageWidth -
      informationPadding
  );

  const voterGap = 5;

  const voterSize = 44;

  return (
    <ScrollView
      style={styles.resultsScroll}
      contentContainerStyle={styles.resultsContent}
      showsVerticalScrollIndicator={false}
    >
      {sortedResults.map((item, index) => {
        const votes = Number(item.votes) || 0;

        const rank =
          sortedResults.findIndex(
            (result) => (Number(result.votes) || 0) === votes
          ) + 1;

        const isFirst = rank === 1;

        const player = players.find(
          (p) =>
            String(p.id) === String(item.id)
        );

        const percentage =
          totalVotes > 0
            ? Math.round(
                (votes / totalVotes) * 100
              )
            : 0;

        const voterIds = Array.isArray(item.voterIds)
          ? item.voterIds
          : [];

        // Grupperer stemmegivere i rækker af 3.
        const voterRows = [];

        for (
          let i = 0;
          i < voterIds.length;
          i += 3
        ) {
          voterRows.push(
            voterIds.slice(i, i + 3)
          );
        }

        return (
          <View
            key={String(item.id ?? index)}
            style={[
              styles.resultRow,
              isFirst && styles.firstResultRow,
              {
                alignItems: "center",
              },
            ]}
          >
            {/* PLACERING */}

            <View
              style={[
                styles.rankCircle,
                isFirst && styles.firstRankCircle,
              ]}
            >
              <Text
                style={[
                  styles.rankText,
                  isFirst && styles.firstRankText,
                ]}
              >
                {rank}
              </Text>
            </View>

            {/* STORT PROFILBILLEDE */}

            <View
              style={{
                alignSelf: "center",
              }}
            >
              <PlayerPhoto
                player={player}
                size={76}
              />
            </View>

            {/* NAVN OG STEMMEGIVERE */}

            <View
              style={[
                styles.resultInformation,
                {
                  alignSelf: "stretch",
                  justifyContent: showVoters
                    ? "flex-start"
                    : "center",
                  paddingTop: showVoters ? 12 : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.resultName,
                  isFirst && styles.firstResultName,
                  {
                    marginBottom:
                      showVoters &&
                      voterIds.length > 0
                        ? 10
                        : 4,
                  },
                ]}
                numberOfLines={1}
              >
                {item.label ||
                  player?.name ||
                  "Spiller"}
              </Text>

              {showVoters ? (
                <View
                  style={{
                    alignItems: "flex-start",
                    gap: 5,
                  }}
                >
                  {voterRows.map(
                    (row, rowIndex) => (
                      <View
                        key={`row-${rowIndex}`}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: voterGap,
                        }}
                      >
                        {row.map(
                          (voterId, voterIndex) => {
                            const voter =
                              players.find(
                                (p) =>
                                  String(p.id) ===
                                  String(voterId)
                              );

                            return (
                              <View
                                key={`${voterId}-${voterIndex}`}
                                style={
                                  styles.voterPhotoItem
                                }
                              >
                                <PlayerPhoto
                                  player={voter}
                                  size={voterSize}
                                />
                              </View>
                            );
                          }
                        )}
                      </View>
                    )
                  )}
                </View>
              ) : (
                <>
                  <Text
                    style={[
                      styles.resultVotes,
                      isFirst &&
                        styles.firstResultVotes,
                    ]}
                  >
                    {votes}{" "}
                    {votes === 1
                      ? "stemme"
                      : "stemmer"}
                  </Text>

                  <View
                    style={[
                      styles.progressTrack,
                      isFirst &&
                        styles.firstProgressTrack,
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        isFirst &&
                          styles.firstProgressFill,
                        {
                          width: `${percentage}%`,
                        },
                      ]}
                    />
                  </View>
                </>
              )}
            </View>

            {/* PROCENT */}

            <View
              style={[
                styles.percentageContainer,
                {
                  width: percentageWidth,
                  alignSelf: showVoters
                    ? "flex-start"
                    : "center",
                  paddingTop: showVoters ? 12 : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.resultPercentage,
                  isFirst &&
                    styles.firstResultPercentage,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {percentage}%
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}



/**
 * =====================================================
 * MOST LIKELY VOTING
 * =====================================================
 *
 * Styrer de tre visninger:
 *
 * 1. Afstemning
 * 2. Venter på andre spillere
 * 3. Resultater
 *
 * Hosten styrer næste runde fra GamePlayScreen.
 */

export default function MostLikelyVoting({
  card,
  players = [],
  voting,
  selectedVote,
  voteProgress,
  voteResults,
  onVote,
}) {
  
  const [localVote, setLocalVote] = useState(null);
  const [showSelection, setShowSelection] = useState(false);
  const voteTimerRef = useRef(null);

  const roundId = voting?.roundId;

  /**
   * Nulstil markeringen ved ny runde.
   */
  useEffect(() => {
    if (voteTimerRef.current) {
      clearTimeout(voteTimerRef.current);
      voteTimerRef.current = null;
    }

    setLocalVote(null);
    setShowSelection(false);

    return () => {
      if (voteTimerRef.current) {
        clearTimeout(voteTimerRef.current);
        voteTimerRef.current = null;
      }
    };
  }, [roundId]);

  /**
   * Vis kortvarigt den valgte spiller,
   * inden venteskærmen vises.
   */


  const handleVote = (playerId) => {
    if (localVote != null || selectedVote != null) {
      return;
    }

    setLocalVote(playerId);
    setShowSelection(true);

    onVote?.(playerId);

    if (voteTimerRef.current) {
      clearTimeout(voteTimerRef.current);
    }

    voteTimerRef.current = setTimeout(() => {
      setShowSelection(false);
      voteTimerRef.current = null;
    }, 450);
  };

  const hasVoted =
  localVote != null || selectedVote != null;
  const hasResults = voteResults != null;

  const votedCount =
    voteProgress?.votedCount ??
    voting?.votedCount ??
    (hasVoted ? 1 : 0);

  const totalCount =
    voteProgress?.totalCount ??
    voting?.totalCount ??
    players.length;

  const results = Array.isArray(voteResults)
    ? voteResults
    : voteResults?.results || [];

  /**
   * Backend bestemmer tilfældigt,
   * om stemmegiverne skal vises.
   */
  const showVoters = Boolean(
    voteResults?.showVoters ??
      voting?.showVoters
  );

  return (
    <View style={styles.root}>
      <BackgroundDecorations />

      <GameHeader />

      {hasResults ? (
        <ResultsScreen
          results={results}
          players={players}
          showVoters={showVoters}
        />
      ) : hasVoted && !showSelection ? (
        <WaitingScreen
          votedCount={votedCount}
          totalCount={totalCount}
        />
      ) : (
      <VotingScreen
        card={card}
        players={players}
        selectedVote={localVote ?? selectedVote}
        onVote={handleVote}
      />
      )}
    </View>
  );
}

/**
 * =====================================================
 * STYLES
 * =====================================================
 */

const styles = StyleSheet.create({
  /**
   * ---------------------------------------------------
   * MAIN SCREEN
   * ---------------------------------------------------
   */

  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },

  /**
   * ---------------------------------------------------
   * BACKGROUND
   * ---------------------------------------------------
   */

  decorationRight: {
    position: "absolute",
    right: -90,
    top: 145,
    width: 185,
    height: 225,
    borderRadius: 100,
    backgroundColor: COLORS.lightBlue,
  },

  decorationBottom: {
    position: "absolute",
    left: -70,
    bottom: -95,
    width: 190,
    height: 195,
    borderRadius: 95,
    backgroundColor: COLORS.lightBlue,
  },

  /**
   * ---------------------------------------------------
   * HEADER / LOGO
   * ---------------------------------------------------
   */

  header: {
    width: "100%",
    height: 165,
    paddingTop: 25,
    paddingHorizontal: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    marginTop: 25,
    marginBottom: -40,
  },

  headerLogo: {
    width: "100%",
    height: 125,
  },

  /**
   * ---------------------------------------------------
   * QUESTION
   * ---------------------------------------------------
   */

  votingScroll: {
    flex: 1,
  },

  votingContent: {
    paddingTop: 35,
    paddingBottom: 55,
    alignItems: "center",
  },

  questionBox: {
    width: "86%",
    minHeight: 118,
    paddingHorizontal: 20,
    paddingVertical: 28,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  questionText: {
    color: COLORS.navy,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 29,
    textAlign: "center",
  },

  /**
   * ---------------------------------------------------
   * PLAYER VOTING GRID
   * ---------------------------------------------------
   */

  playerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 15,
    rowGap: 32,
    columnGap: 20,
  },

  playerItem: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 4,
  },

  playerName: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: "500",
    marginTop: 9,
    textAlign: "center",
    maxWidth: "95%",
  },

  selectedName: {
    fontWeight: "800",
    color: COLORS.blue,
  },

  /**
   * ---------------------------------------------------
   * PROFILE PHOTOS
   * ---------------------------------------------------
   */

  photoOuter: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  photoFallback: {
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  photoInitial: {
    color: COLORS.navy,
    fontSize: 30,
    fontWeight: "700",
  },

  /**
   * ---------------------------------------------------
   * WAITING SCREEN
   * ---------------------------------------------------
   */

  waitingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  waitingIcons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },

  waitingPerson: {
    width: 30,
    height: 49,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  waitingPersonActive: {
    opacity: 1,
  },

  waitingPersonInactive: {
    opacity: 0.3,
  },

  waitingHead: {
    width: 16,
    height: 16,
    borderWidth: 2.5,
    borderColor: COLORS.blue,
    borderRadius: 8,
    marginBottom: 4,
  },

  waitingBody: {
    width: 28,
    height: 27,
    borderWidth: 2.5,
    borderColor: COLORS.blue,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: COLORS.lightBlue,
  },

  waitingCount: {
    color: COLORS.navy,
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },

  waitingSubtitle: {
    color: COLORS.blue,
    fontSize: 17,
    fontWeight: "400",
    textAlign: "center",
  },

  /**
   * ---------------------------------------------------
   * RESULTS SCREEN
   * ---------------------------------------------------
   *
   * Centrerer de tre resultatkort lodret.
   */

  resultsScroll: {
    flex: 1,
  },

  resultsContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 100,
    gap: 16,
  },

  /**
   * ---------------------------------------------------
   * RESULT CARDS
   * ---------------------------------------------------
   */

  resultRow: {
    width: "100%",
    minHeight: 112,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  // Førstepladsen får blå baggrund.
  firstResultRow: {
    backgroundColor: COLORS.blue,
  },

  /**
   * ---------------------------------------------------
   * RANKING
   * ---------------------------------------------------
   */

  rankCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  // Hvid cirkel på førstepladsen.
  firstRankCircle: {
    backgroundColor: COLORS.white,
  },

  rankText: {
    color: COLORS.blue,
    fontSize: 17,
    fontWeight: "800",
  },

  // Blåt 1-tal i den hvide cirkel.
  firstRankText: {
    color: COLORS.blue,
  },

  /**
   * ---------------------------------------------------
   * RESULT INFORMATION
   * ---------------------------------------------------
   */


  resultInformation: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingLeft: 10,
    paddingRight: 8,
    justifyContent: "center",
  },


  resultName: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },

  firstResultName: {
    color: COLORS.white,
  },

  resultVotes: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 7,
  },

  firstResultVotes: {
    color: COLORS.white,
    opacity: 0.85,
  },

  /**
   * ---------------------------------------------------
   * PROGRESS BAR
   * ---------------------------------------------------
   */

  progressTrack: {
    width: "100%",
    height: 11,
    borderRadius: 7,
    backgroundColor: COLORS.track,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.blue,
    borderRadius: 7,
  },

  // Lys baggrund på førstepladsens bjælke.
  firstProgressTrack: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  // Hvid fremdriftsbjælke på førstepladsen.
  firstProgressFill: {
    backgroundColor: COLORS.white,
  },

  /**
   * ---------------------------------------------------
   * VOTER PHOTOS
   * ---------------------------------------------------
   */

  voterPhotos: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-start",
    width: 3 * (44 + 8) + 2 * 5,
    maxWidth: "100%",
    columnGap: 5,
    rowGap: 5,
    marginTop: 4,
  },

  voterPhotoItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  /**
   * ---------------------------------------------------
   * PERCENTAGE
   * ---------------------------------------------------
   */

  percentageContainer: {
    width: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  resultPercentage: {
    color: COLORS.blue,
    fontSize: 18,
    fontWeight: "800",
  },

  firstResultPercentage: {
    color: COLORS.white,
  },
});
