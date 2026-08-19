window.RAID_DATA = {
  bosses: [
    {
      id:'void-beast', number:1, name:'VOID BEAST', subtitle:'THE FIRST ENCLOSURE',
      hp:1110, accent:'#ff526f', territory:'rgba(18,82,118,.99)',
      description:'弾幕と狙い撃ち。基本となるレイドボス。', attack:'void'
    },
    {
      id:'ricochet-core', number:2, name:'RICOCHET CORE', subtitle:'THE BOUNCING ENGINE',
      hp:1110, accent:'#ff934d', territory:'rgba(128,58,18,.99)',
      description:'反射弾を多用し、長時間フィールドに弾を残す。', attack:'ricochet'
    },
    {
      id:'grid-seraph', number:3, name:'GRID SERAPH', subtitle:'THE ROTATING SIGNAL',
      hp:1110, accent:'#b77cff', territory:'rgba(92,42,148,.99)',
      description:'4本の回転レーザーを維持したまま、ステージ内をゆっくり漂う。', attack:'seraph'
    },
    {
      id:'gravity-maw', number:4, name:'GRAVITY MAW', subtitle:'THE SINKING ENGINE',
      hp:1110, accent:'#5dffbf', territory:'rgba(14,116,82,.99)',
      description:'重力井戸、全方位弾幕、陣地破壊弾。', attack:'gravity'
    },
    {
      id:'oracle-engine', number:5, name:'ORACLE ENGINE', subtitle:'THE MARKED GROUND',
      hp:1110, accent:'#ff4fd8', territory:'rgba(128,26,100,.99)',
      description:'円形AoE予兆と連続着弾。', attack:'telegraph'
    },
    {
      id:'hex-choir', number:6, name:'HEX CHOIR', subtitle:'THE SAFE GAP',
      hp:1110, accent:'#67a8ff', territory:'rgba(28,74,146,.99)',
      description:'AoEリングに安全な隙間を残すパターン攻撃。', attack:'choir'
    }
  ],
  skills:[
    {id:'phase-dash',name:'PHASE DASH',description:'短距離ダッシュ＋短い無敵',cooldown:8,type:'dash'},
    {id:'field-repair',name:'FIELD REPAIR',description:'ライフを1回復',cooldown:18,type:'heal'},
    {id:'overclock',name:'OVERCLOCK',description:'5秒間移動速度アップ',cooldown:14,type:'speed'}
  ],
  charms:[
    {id:'runner-coil',name:'RUNNER COIL',rarity:'COMMON',description:'移動速度アップ',modifiers:{moveSpeedMultiplier:1.12}},
    {id:'spare-heart',name:'SPARE HEART',rarity:'COMMON',description:'最大ライフ増加',modifiers:{maxHpAdd:1}},
    {id:'cold-clock',name:'COLD CLOCK',rarity:'COMMON',description:'スキルCD短縮',modifiers:{cooldownMultiplier:.86}},
    {id:'ink-drive',name:'INK DRIVE',rarity:'UNCOMMON',description:'描画中移動速度アップ',modifiers:{drawingSpeedMultiplier:1.18}},
    {id:'relic-lens',name:'RELIC LENS',rarity:'RARE',description:'コアダメージアップ',modifiers:{relicDamageMultiplier:1.25}},
    {id:'second-signal',name:'SECOND SIGNAL',rarity:'EPIC',description:'死亡を1回防ぐ',modifiers:{deathSaveCharges:1}}
  ]
};
