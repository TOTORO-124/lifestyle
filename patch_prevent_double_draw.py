import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  useEffect(() => {
    if (drawingState && drawingState.drawer === currentUser.uid) {
      const elapsed = Date.now() - drawingState.timestamp;
      const delay = Math.max(0, 2500 - elapsed); // 2.5 seconds suspense
      const timer = setTimeout(() => {
        handleDrawCard(drawingState.pid, drawingState.cardIndex);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [drawingState, currentUser.uid]);"""

replacement = """  const processedDrawRef = useRef<number | null>(null);

  useEffect(() => {
    if (drawingState && drawingState.drawer === currentUser.uid) {
      if (processedDrawRef.current === drawingState.timestamp) return;

      const elapsed = Date.now() - drawingState.timestamp;
      const delay = Math.max(0, 2500 - elapsed); // 2.5 seconds suspense
      const timer = setTimeout(() => {
        processedDrawRef.current = drawingState.timestamp;
        handleDrawCard(drawingState.pid, drawingState.cardIndex);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [drawingState, currentUser.uid]);"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced double draw prevention!")
else:
    print("Target not found.")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
