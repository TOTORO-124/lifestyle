const fs = require('fs');

let path = 'src/components/OneCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const stateTarget = `  const [suitPickerOpen, setSuitPickerOpen] = useState(false);
  const [pendingCardIndex, setPendingCardIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [oneCardDeclared, setOneCardDeclared] = useState(false);
  const [showRules, setShowRules] = useState(false);`;

const stateReplace = `  const [suitPickerOpen, setSuitPickerOpen] = useState(false);
  const [pendingCardIndex, setPendingCardIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [oneCardDeclared, setOneCardDeclared] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Attack Effect
  const [shake, setShake] = useState(false);
  const prevPenalty = useRef(gameState.penaltyStack);
  const prevTopCard = useRef(gameState.discardPile[gameState.discardPile.length - 1]?.id);

  useEffect(() => {
    const currentTop = gameState.discardPile[gameState.discardPile.length - 1];
    if (gameState.penaltyStack > prevPenalty.current || (currentTop && currentTop.id !== prevTopCard.current && (currentTop.suit === 'joker' || currentTop.rank === 'A' || currentTop.rank === '2'))) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    prevPenalty.current = gameState.penaltyStack;
    prevTopCard.current = currentTop?.id;
  }, [gameState.penaltyStack, gameState.discardPile]);

  const [showEmojis, setShowEmojis] = useState(false);
  const emojis = ['😆', '😭', '😡', '👀', '🚨', '💥'];
`;

code = code.replace(stateTarget, stateReplace);

fs.writeFileSync(path, code);
console.log('patched animations 2');
