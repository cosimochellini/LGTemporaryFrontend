import { player } from "@/types/sanity";
import { roleConstants, sanityTypes } from "@/constants/roleConstants";

import {
  QueryBuilder,
  ConditionBuilder,
  PaginationBuilder,
} from "@/utils/sanityQueryBuilder";

const LS_PLAYER_KEY = "LG_stored_user";

const loginQuery = new QueryBuilder(sanityTypes.player)
  .select(
    `_id, name, surname, nickname, email, profileImage, 'roles': roles[]->role->name`
  )
  .get(new PaginationBuilder().first())
  .freeze();

const login = (name: string, pin: string) =>
  loginQuery
    .where(
      new ConditionBuilder(
        "(nickname == $name && pin == $pin) || (email == $name && pin == $pin)"
      ).params({ name: name.toLowerCase(), pin: Number.parseInt(pin) })
    )
    .fetch<player | null>(false)
    .then((p) => setPlayer(p));

const isAuthorized = (
  roles: roleConstants[] = [],
  player: player | null = getPlayer()
): boolean => {
  if (player === null) return false;

  if (!roles.length) return isLogged(player);

  if (player.roles.includes(roleConstants.Admin)) return true;

  for (const role of player.roles) if (roles.includes(role)) return true;

  return false;
};

const isLogged = (player: player | null = null) => {
  if (player === null) {
    player = getPlayer();
  }

  return player !== null;
};

const setPlayer = (player: player | null) => {
  localStorage.setItem(LS_PLAYER_KEY, JSON.stringify(player));

  return player;
};

const getPlayer = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_PLAYER_KEY) ?? "") as player;
  } catch (error) {
    setPlayer(null);
    return null;
  }
};

export { login, isAuthorized, getPlayer, setPlayer };
