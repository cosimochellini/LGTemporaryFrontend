<template>
  <div class="max-w-xl md:max-w-4xl px-4 py-4 mx-auto">
    <div class="font-semibold my-4">
      <label>Giocatore corrente</label>
      <user-autocomplete v-model="currentPlayer" class="block px-2 py-1" />
    </div>
    <h2 class="font-semibold">Statistiche 📊</h2>
    <div
      class="grid grid-flow-row gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
    >
      <div
        class="flex flex-col justify-center px-4 py-4 bg-white border border-gray-300 rounded"
        v-for="statistic in statistics"
        :key="statistic.message"
      >
        <div>
          <p class="text-3xl font-semibold text-center text-gray-800">
            {{ statistic.value }}
          </p>
          <p class="text-lg text-center text-gray-500">
            {{ statistic.message }}
          </p>
        </div>
      </div>
    </div>
    <h3 class="font-semibold" v-show="topMates.length">Accoppiamenti</h3>

    <div
      class="sm:grid sm:grid-flow-row sm:gap-4 sm:grid-cols-1 md:grid-cols-2"
    >
      <div>
        <h3 class="font-medium">Migliori 👑</h3>

        <div
          class="flex flex-col justify-center px-4 py-4 bg-white border border-gray-300 rounded m-2"
          v-for="mate in topMates"
          :key="mate.player._id"
        >
          <div class="flex justify-evenly items-center">
            <img
              class="w-10 h-10 rounded-full"
              :src="urlFor(mate.player.player.profileImage).width(100)"
            />
            <span
              class="ml-2 text-gray-700 font-semibold font-sans tracking-wide"
            >
              {{ mate.nickname }}
            </span>
            <span
              class="ml-4 rounded-xl px-2 py-1 font-semibold"
              :class="mate.ratio > 0.5 ? 'bg-green-300' : 'bg-red-300'"
            >
              {{ percentageFormatter(mate.ratio) }} %
            </span>
          </div>
        </div>
      </div>
      <div>
        <h3 class="font-medium">Peggiori 👎</h3>

        <div
          class="flex flex-col justify-center px-4 py-4 bg-white border border-gray-300 rounded m-2"
          v-for="mate in worstMates"
          :key="mate.player._id"
        >
          <div class="flex justify-around items-center">
            <img
              class="w-10 h-10 rounded-full"
              :src="urlFor(mate.player.player.profileImage).width(100)"
            />
            <span
              class="ml-2 text-gray-700 font-semibold font-sans tracking-wide"
            >
              {{ mate.nickname }}
            </span>
            <span
              class="ml-4 rounded-xl px-2 py-1 font-semibold"
              :class="mate.ratio > 0.5 ? 'bg-green-300' : 'bg-red-300'"
            >
              {{ percentageFormatter(mate.ratio) }} %
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { urlFor } from "@/instances/sanity";
import { byNumber, byValue } from "sort-es";
import { getPlayer } from "@/services/authService";
import { Mate } from "@/utils/classes/stats/baseStats";
import { sanityTypes } from "@/constants/roleConstants";
import { percentageFormatter } from "@/utils/formatters";
import { player, secretHitlerMatchPlayer } from "@/types/sanity";
import UserAutocomplete from "@/components/form/UserAutocomplete.vue";
import { ConditionBuilder, QueryBuilder } from "@/utils/sanityQueryBuilder";
import { SecretHitlerStats } from "@/utils/classes/stats/secretHitlerMatchStats";

const matchesQuery = new QueryBuilder(sanityTypes.secretHitlerMatchPlayer)
  .select("..., player ->, match -> {..., players[] -> {...,player -> } }")
  .freeze();

export default defineComponent({
  components: { UserAutocomplete },
  data() {
    return {
      matches: [] as secretHitlerMatchPlayer[],
      currentPlayer: {} as player,
    };
  },
  mounted() {
    this.currentPlayer = getPlayer() as player;

    this.loadMatches();
  },
  methods: {
    urlFor,
    percentageFormatter,
    loadMatches() {
      matchesQuery
        .where(
          new ConditionBuilder("player._ref == $playerId").params({
            playerId: this.currentPlayer._id,
          })
        )
        .fetch<secretHitlerMatchPlayer[]>()
        .then((matches) => (this.matches = matches));
    },
  },
  watch: {
    currentPlayer: {
      handler() {
        this.loadMatches();
      },
      deep: true,
    },
  },
  computed: {
    stats(): SecretHitlerStats {
      return new SecretHitlerStats(this.matches, this.currentPlayer);
    },
    statistics(): { message: string; value: string }[] {
      const { matches, wonMatches, lostMatches, ratio } = this.stats;
      const { penaltyPoints, liberalMatches, hitlerMatches } = this.stats;
      const { fascistMatches } = this.stats;

      return [
        { message: "totale partite", value: matches.length.toString() },
        { message: "vittorie", value: wonMatches.length.toString() },
        { message: "sconfitte", value: lostMatches.length.toString() },
        { message: "vittorie", value: `${percentageFormatter(ratio)} %` },
        { message: "penalità", value: penaltyPoints.length.toString() },
        {
          message: "partite liberali",
          value: liberalMatches.length.toString(),
        },
        {
          message: "partite fasciste",
          value: fascistMatches.length.toString(),
        },
        {
          message: "partite hitler",
          value: hitlerMatches.length.toString(),
        },
      ];
    },
    topMates(): Mate[] {
      return this.stats.mates.slice(0, 3);
    },
    worstMates(): Mate[] {
      const { mates } = this.stats;
      return mates
        .slice(mates.length - 3, mates.length)
        .sort(byValue("ratio", byNumber()));
    },
  },
});
</script>

<style>
</style>