const fs = require('fs');
const path = 'src/components/OneCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `                })}
              </AnimatePresence>
            </div>
          </div>
        )}
        </div>
      )}`;

const replaceStr = `                })}
              </AnimatePresence>
            </div>
          </div>
          </>
        )}
        </div>
      )}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync(path, code);
console.log('patched my hand UI 3');
