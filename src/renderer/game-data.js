window.RAID_DATA = {
  bosses: [
    {
      id:'void-beast', number:1, name:'VOID BEAST', subtitle:'THE VOID BEAST',
      hp:1110, accent:'#ff315c', territory:'rgba(18,82,118,.99)',
      description:'放射弾幕と狙い撃ち。後半ほど発射密度が上がる。',
      attack:'void'
    },
    {
      id:'richochet', number:2, name:'RICHOCHET', subtitle:'THE BOUNCING CORE',
      hp:1110, accent:'#ff934d', territory:'rgba(128,58,18,.99)',
      description:'大型反射弾。壁と陣地で5回反射して消滅する。',
      attack:'ricochet'
    },
    {
      id:'grid-seraph', number:3, name:'GRID SERAPH', subtitle:'THE CUTTING HALO',
      hp:1110, accent:'#b77cff', territory:'rgba(92,42,148,.99)',
      description:'専用ギミック：4本の回転レーザーを維持したまま、ステージ内をゆっくり漂う。',
      attack:'seraph'
    },
    {
      id:'gravity-maw', number:4, name:'GRAVITY MAW', subtitle:'THE SINKING ENGINE',
      hp:1110, accent:'#5dffbf', territory:'rgba(14,116,82,.99)',
      description:'専用ギミック：3つの重力井戸が移動を引き寄せ、周期的に全方位弾幕を放つ。',
      attack:'gravity'
    },
    {
      id:'oracle-engine', number:5, name:'ORACLE ENGINE', subtitle:'THE MARKED GROUND',
      hp:1110, accent:'#ff4fd8', territory:'rgba(128,26,100,.99)',
      description:'汎用AoE予兆システムを使用。円形予兆の猶予後、その範囲内にダメージを与える。',
      attack:'telegraph'
    },
    {
      id:'hex-choir', number:6, name:'HEX CHOIR', subtitle:'THE SAFE GAP',
      hp:1110, accent:'#67a8ff', territory:'rgba(28,74,146,.99)',
      description:'AoE予兆を輪状に展開し、1か所だけ安全な隙間を残すパターン攻撃。',
      attack:'choir'
    }
  ],
  skills: [
    {id:'phase-dash',name:'PHASE DASH',description:'Short invulnerable dash in the movement direction.',cooldown:8,type:'dash'},
    {id:'repair-pulse',name:'REPAIR PULSE',description:'Restore 1 HP, up to your current maximum.',cooldown:24,type:'heal'},
    {id:'overclock',name:'OVERCLOCK',description:'Gain +45% movement speed for 5 seconds.',cooldown:18,type:'speed'}
  ],
  charms: [
    {id:'runner-coil',name:'RUNNER COIL',rarity:'COMMON',description:'+12% movement speed.',modifiers:{moveSpeedMultiplier:1.12}},
    {id:'spare-heart',name:'SPARE HEART',rarity:'UNCOMMON',description:'+1 maximum HP.',modifiers:{maxHpAdd:1}},
    {id:'cold-clock',name:'COLD CLOCK',rarity:'RARE',description:'Skill cooldowns recover 18% faster.',modifiers:{cooldownMultiplier:.82}},
    {id:'hazard-lace',name:'HAZARD LACE',rarity:'UNCOMMON',description:'+15% movement speed while drawing a cut.',modifiers:{drawingSpeedMultiplier:1.15}},
    {id:'relic-teeth',name:'RELIC TEETH',rarity:'RARE',description:'Core destruction deals +20% integrity damage, but every core is still required.',modifiers:{relicDamageMultiplier:1.20}},
    {id:'soft-reset',name:'SOFT RESET',rarity:'EPIC',description:'First lethal hit in a raid leaves you at 1 HP.',modifiers:{deathSaveCharges:1}}
  ]
};
