/**
 * D4JSP Build Planner — Damage & Defense Calculator
 * Based on bytemind-de/d4-tools formulas (MIT licensed)
 *
 * Damage = baseDmg × skillMult × statFactor × additiveBucket × multiplicativeBucket
 *          × vulnerableMult × critMult × overpowerMult × (1 - enemyDR)
 *
 * All additive bonuses SUM into one bucket.
 * All multiplicative bonuses COMPOUND (each multiplies independently).
 * Crit, Vulnerable, Overpower are independent multipliers on top.
 */

// ── Main stat scaling per class ─────────────────────────────────────────────
// Barbarian scales with Strength at 9.0909 per 1%; all others at 8 per 1%
const MAIN_STAT_SCALING = {
  barbarian:   9.0909,
  druid:       8,
  necromancer: 8,
  rogue:       8,
  sorcerer:    8,
  spiritborn:  8,
  paladin:     8,
};

// Which core stat is the "main stat" for each class
const MAIN_STAT_KEY = {
  barbarian:   'strength',
  druid:       'willpower',
  necromancer: 'intelligence',
  rogue:       'dexterity',
  sorcerer:    'intelligence',
  spiritborn:  'dexterity',
  paladin:     'strength',
};

// ── Stat bonuses from core attributes ───────────────────────────────────────
// Per point of each attribute (D4 Season 10+ values)
const STAT_BONUSES = {
  strength:     { armor: 1, skillDamage: 0 },  // 1 armor per point; main stat → dmg
  intelligence: { allRes: 0.025, skillDamage: 0 }, // 0.025% all res per point
  willpower:    { healingReceived: 0.001, overpower: 0.0025, skillDamage: 0 },
  dexterity:    { dodgeChance: 0.001, critChance: 0.0002, skillDamage: 0 },
};

// ── Armor → Damage Reduction (Season 6+ formula, cap at 1000 armor = 85%) ──
export function armorToDR(armor, monsterLevel = 100) {
  if (armor >= 1000) return 0.85;
  if (armor <= 0) return 0;

  const c1 = 1.599 * Math.exp(monsterLevel / 8.901 - 8.680) + 1.025;
  const x = armor / (3.13 * monsterLevel) - 3.8;
  const sigmoid = Math.exp(x) / (1 + Math.exp(x));
  const dr = (85 * c1 * sigmoid - 3.0) / 100;
  return Math.max(0, Math.min(0.85, dr));
}

// ── Resistance → Element DR (direct %) ──────────────────────────────────────
export function resistanceToDR(resistancePct) {
  return Math.max(0, Math.min(0.70, resistancePct / 100));
}

// ── Total Damage Reduction (all sources multiply) ───────────────────────────
export function totalDR(drSources = [], hasFortify = false) {
  let remaining = 1;
  for (const dr of drSources) {
    remaining *= (1 - dr);
  }
  if (hasFortify) remaining *= 0.85; // Fortify = 15% DR (Season 4+)
  return 1 - remaining;
}

// ── Effective Life ──────────────────────────────────────────────────────────
export function effectiveLife(maxLife, drPct) {
  return maxLife / (1 - drPct);
}

// ── Damage Calculation ──────────────────────────────────────────────────────
/**
 * @param {Object} params
 * @param {number} params.baseDamage        - weapon base damage (avg of min+max)
 * @param {number} params.skillMultiplier   - skill damage % (e.g. 120 for 120%)
 * @param {string} params.classId           - class identifier
 * @param {number} params.mainStatValue     - total main stat points
 * @param {number[]} params.additiveBonuses - array of additive damage % values
 * @param {number[]} params.multiBonuses    - array of multiplicative damage % values
 * @param {number} params.critChance        - crit chance 0-1
 * @param {number} params.critDamage        - crit damage bonus % (base 50)
 * @param {number} params.vulnDamage        - vulnerable damage bonus % (base 20)
 * @param {boolean} params.isVulnerable     - target is vulnerable
 * @param {number} params.overpowerChance   - overpower chance 0-1
 * @param {number} params.overpowerDamage   - overpower damage bonus % (base 50)
 * @param {number[]} params.enemyDR         - array of enemy damage reduction % values
 */
export function calculateDamage({
  baseDamage = 100,
  skillMultiplier = 100,
  classId = 'barbarian',
  mainStatValue = 0,
  additiveBonuses = [],
  multiBonuses = [],
  critChance = 0.05,
  critDamage = 50,
  vulnDamage = 20,
  isVulnerable = false,
  overpowerChance = 0.03,
  overpowerDamage = 50,
  enemyDR = [],
} = {}) {
  const scaling = MAIN_STAT_SCALING[classId] || 8;

  // Skill multiplier
  const skillFactor = skillMultiplier / 100;

  // Main stat factor
  const statFactor = 1 + (mainStatValue / scaling / 100);

  // Additive bucket: 1 + SUM(all additive %)
  const addFactor = 1 + additiveBonuses.reduce((sum, pct) => sum + pct / 100, 0);

  // Multiplicative bucket: PRODUCT(1 + each %)
  const multiFactor = multiBonuses.reduce((prod, pct) => prod * (1 + pct / 100), 1);

  // Base hit (no crit, no vulnerable, no overpower)
  const baseHit = baseDamage * skillFactor * statFactor * addFactor * multiFactor;

  // Crit multiplier
  const critMult = 1 + critDamage / 100;

  // Vulnerable multiplier
  const vulnMult = isVulnerable ? (1 + vulnDamage / 100) : 1;

  // Overpower multiplier
  const opMult = 1 + overpowerDamage / 100;

  // Average damage across 4 cases: normal, crit-only, op-only, crit+op
  const pCrit = Math.min(1, Math.max(0, critChance));
  const pOp = Math.min(1, Math.max(0, overpowerChance));
  const pNone = (1 - pCrit) * (1 - pOp);
  const pCritOnly = pCrit * (1 - pOp);
  const pOpOnly = (1 - pCrit) * pOp;
  const pBoth = pCrit * pOp;

  const avgHit = baseHit * (
    pNone * 1 +
    pCritOnly * critMult +
    pOpOnly * opMult +
    pBoth * critMult * opMult
  ) * vulnMult;

  // Enemy damage reduction
  let enemyFactor = 1;
  for (const dr of enemyDR) {
    enemyFactor *= (1 - dr / 100);
  }

  return {
    baseHit: Math.round(baseHit),
    critHit: Math.round(baseHit * critMult),
    avgHit: Math.round(avgHit * enemyFactor),
    dps: Math.round(avgHit * enemyFactor), // per-hit; multiply by attack speed for actual DPS
  };
}

// ── Derive all character stats from equipment + class ───────────────────────
/**
 * @param {string} classId
 * @param {Object} coreStats  - { strength, intelligence, willpower, dexterity }
 * @param {Object[]} items    - array of equipped items with affixes
 * @returns {Object} computed stat sheet
 */
export function computeCharacterStats(classId, coreStats, items = []) {
  const mainKey = MAIN_STAT_KEY[classId] || 'strength';

  // Gather all stat modifiers from items
  let totalStr = coreStats.strength || 0;
  let totalInt = coreStats.intelligence || 0;
  let totalWil = coreStats.willpower || 0;
  let totalDex = coreStats.dexterity || 0;
  let bonusArmor = 0;
  let bonusArmorPct = 0;
  let bonusLife = 0;
  let bonusLifePct = 0;
  let additiveDmg = [];
  let multiDmg = [];
  let bonusCritChance = 0;
  let bonusCritDamage = 0;
  let bonusAllRes = 0;
  let bonusFireRes = 0;
  let bonusColdRes = 0;
  let bonusLightRes = 0;
  let bonusPoisonRes = 0;
  let bonusShadowRes = 0;
  let bonusMoveSpeed = 0;
  let bonusCDR = 0;

  items.forEach(item => {
    if (!item?.affixes) return;
    item.affixes.forEach(aff => {
      const val = aff.value || 0;
      switch (aff.type) {
        case 'strength':        totalStr += val; break;
        case 'intelligence':    totalInt += val; break;
        case 'willpower':       totalWil += val; break;
        case 'dexterity':       totalDex += val; break;
        case 'all_stats':       totalStr += val; totalInt += val; totalWil += val; totalDex += val; break;
        case 'armor':           bonusArmor += val; break;
        case 'armor_pct':       bonusArmorPct += val; break;
        case 'life':            bonusLife += val; break;
        case 'life_pct':        bonusLifePct += val; break;
        case 'additive_damage': additiveDmg.push(val); break;
        case 'multi_damage':    multiDmg.push(val); break;
        case 'crit_chance':     bonusCritChance += val; break;
        case 'crit_damage':     bonusCritDamage += val; break;
        case 'all_res':         bonusAllRes += val; break;
        case 'fire_res':        bonusFireRes += val; break;
        case 'cold_res':        bonusColdRes += val; break;
        case 'lightning_res':   bonusLightRes += val; break;
        case 'poison_res':      bonusPoisonRes += val; break;
        case 'shadow_res':      bonusShadowRes += val; break;
        case 'move_speed':      bonusMoveSpeed += val; break;
        case 'cooldown_reduction': bonusCDR += val; break;
        default: break;
      }
    });
  });

  // Core stats
  const mainStat = { strength: totalStr, intelligence: totalInt, willpower: totalWil, dexterity: totalDex }[mainKey];

  // Armor: base from strength + flat + % bonuses
  const baseArmor = totalStr; // 1 armor per Strength
  const totalArmor = Math.round((baseArmor + bonusArmor) * (1 + bonusArmorPct / 100));
  const physDR = armorToDR(totalArmor, 100);

  // Life
  const baseLife = 100 + totalWil * 15 + totalStr * 8;
  const totalLife = Math.round((baseLife + bonusLife) * (1 + bonusLifePct / 100));

  // Resistances
  const allResFromInt = totalInt * 0.025;
  const fireRes = Math.min(70, allResFromInt + bonusAllRes + bonusFireRes);
  const coldRes = Math.min(70, allResFromInt + bonusAllRes + bonusColdRes);
  const lightRes = Math.min(70, allResFromInt + bonusAllRes + bonusLightRes);
  const poisonRes = Math.min(70, allResFromInt + bonusAllRes + bonusPoisonRes);
  const shadowRes = Math.min(70, allResFromInt + bonusAllRes + bonusShadowRes);

  // Crit
  const baseCritChance = 0.05 + totalDex * 0.0002; // 5% base + dex bonus
  const critChance = Math.min(1, baseCritChance + bonusCritChance / 100);
  const critDamage = 50 + bonusCritDamage; // 50% base

  // Dodge
  const dodgeChance = Math.min(0.25, totalDex * 0.001);

  // Movement speed
  const moveSpeed = 100 + bonusMoveSpeed;

  // CDR
  const cdr = bonusCDR;

  // Main stat damage factor
  const scaling = MAIN_STAT_SCALING[classId] || 8;
  const mainStatDmgBonus = mainStat / scaling;

  return {
    // Core
    strength: totalStr,
    intelligence: totalInt,
    willpower: totalWil,
    dexterity: totalDex,
    mainStat,
    mainStatKey: mainKey,

    // Offensive
    mainStatDmgBonus: Math.round(mainStatDmgBonus * 10) / 10,
    critChance: Math.round(critChance * 10000) / 100,
    critDamage,
    additiveDmgSources: additiveDmg,
    multiDmgSources: multiDmg,

    // Defensive
    armor: totalArmor,
    armorDR: Math.round(physDR * 10000) / 100,
    life: totalLife,
    fireRes: Math.round(fireRes * 100) / 100,
    coldRes: Math.round(coldRes * 100) / 100,
    lightningRes: Math.round(lightRes * 100) / 100,
    poisonRes: Math.round(poisonRes * 100) / 100,
    shadowRes: Math.round(shadowRes * 100) / 100,
    dodgeChance: Math.round(dodgeChance * 10000) / 100,

    // Utility
    moveSpeed,
    cooldownReduction: cdr,
  };
}
