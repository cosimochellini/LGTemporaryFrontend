import { Ref } from "vue";
import { uuid } from "@/utils";
import { auth } from "../auth.service";
import { overlay } from "../overlay.service";
import { sanityClient } from "@/instances/sanity";
import { notification } from "../notification.service";
import { dialog, dialogType } from "../dialog.service";
import { sanityTypes } from "@/constants";
import { useInfiniteLoading } from "@/composable/infiniteLoading";
import { trumpRank } from "@/utils/classes/stats/ranks/trumpRank";
import { RankingList } from "@/utils/classes/stats/ranks/baseRank";
import { TrumpStats } from "@/utils/classes/stats/trumpMatchStats";
import { groq, reference, referenceWithKey } from "@/utils/GroqQueryBuilder";
import { player, sanityDocument, trumpMatch, trumpMatchPlayer } from "@/types";

export const trump = {
  getMatches(player: Ref<player | null>) {
    const matchesQuery = new groq.QueryBuilder(sanityTypes.trumpMatch)
      .select(`...,  callingPlayer ->, players[] -> {player ->,...}`)
      .orderBy(new groq.OrderBuilder("matchDate", true));

    return useInfiniteLoading<trumpMatch>(matchesQuery, {
      pageSize: 15,
      onFetch: (qb) =>
        qb.where(
          new groq.ConditionBuilder(`$userId in players[] -> player._ref`)
            .params({ userId: player.value?._id })
            .optional()
        ),
    });
  },

  getStats(player: player) {
    return new groq.QueryBuilder(sanityTypes.trumpMatchPlayer)
      .select("..., player ->, match -> {..., players[] -> {...,player -> } }")
      .cached()
      .where(
        new groq.ConditionBuilder("player._ref == $playerId").params({
          playerId: player._id,
        })
      )
      .fetch<trumpMatchPlayer[]>()
      .then((matches) => new TrumpStats(matches, player));
  },

  getRanking() {
    return new groq.QueryBuilder(sanityTypes.trumpMatch)
      .select(
        "..., players[] -> { player ->, match ->{callingPlayer ->, ...}, ...}"
      )
      .cached()
      .fetch<trumpMatch[]>()
      .then((matches) => new RankingList(matches, trumpRank.create));
  },

  getOrderedPlayers() {
    return new groq.QueryBuilder(sanityTypes.player)
      .select(
        "..., 'count': count(*[_type=='trumpMatchPlayer' && references(^._id)])"
      )
      .orderBy(new groq.OrderBuilder("count", true))
      .orderBy(new groq.OrderBuilder("name"))
      .cached()
      .fetch<player[]>();
  },

  async saveNewMatch(match: Partial<trumpMatch>) {
    if (match.players?.length !== 5) return false;

    overlay.show();

    try {
      const matchToCreate = {
        _id: uuid(),
        _type: sanityTypes.trumpMatch,
        matchDate: match.matchDate,
        startingScore: match.startingScore,
        finalScore: match.finalScore,
        callingPlayer: reference(match.callingPlayer!),
        players: [],
        createdBy: reference(auth.currentPlayer),
        updatedBy: undefined,
      } as sanityDocument<trumpMatch>;

      overlay.show();

      await sanityClient.create(matchToCreate);

      const savedPlayers = await Promise.all(
        match.players.map((p) =>
          sanityClient.create({
            _id: uuid(),
            _key: uuid(),
            _type: sanityTypes.trumpMatchPlayer,
            win: p.win,
            penaltyPoint: p.penaltyPoint,
            player: reference(p.player),
            match: reference(matchToCreate),
          } as sanityDocument<trumpMatchPlayer>)
        )
      );

      await sanityClient
        .patch(matchToCreate._id)
        .append("players", savedPlayers.map(referenceWithKey))
        .commit();

      return true;
    } catch (error) {
      notification.danger(error);
      return false;
    }
  },

  async updateMatch(match: trumpMatch) {
    return sanityClient.createOrReplace(match);
  },

  async deleteExistingMatch(match: trumpMatch) {
    try {
      const shouldDelete = await dialog.confirm({
        title: "deleteMatch",
        description: "deleteMatch",
        type: dialogType.danger,
        buttons: { cancel: "cancel", confirm: "confirm" },
      });

      if (!shouldDelete) return false;

      overlay.show();

      await sanityClient.patch(match._id).set({ players: [] }).commit();

      const playersPromises =
        match.players?.map((p) => sanityClient.delete(p._id)) ?? [];

      await Promise.all(playersPromises);

      await sanityClient.delete(match._id);

      notification.success("notification.delete");

      return true;
    } catch (error) {
      notification.danger(error);

      return false;
    } finally {
      overlay.hide();
    }
  },
};
