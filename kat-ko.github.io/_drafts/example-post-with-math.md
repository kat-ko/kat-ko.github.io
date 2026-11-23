---
title: "Example post with math"
tags: [example]
---
Drafts in `_drafts/` are not published. To publish, move the file to `_posts/` and name it `YYYY-MM-DD-some-title.md`. The blog tab appears in the menu automatically once the first post exists.

Inline math uses double dollars inside a sentence: the effective dimensionality $$d_{\mathrm{eff}} = \frac{(\sum_i \lambda_i)^2}{\sum_i \lambda_i^2}$$ of a representation with covariance eigenvalues $$\lambda_i$$.

Display math uses double dollars on their own lines:

$$
\mathcal{L}(\theta) = \sum_{t=1}^{T} \mathbb{E}_{(x,y)\sim \mathcal{D}_t}\big[\ell(f_\theta(x), y)\big]
$$

Code blocks work as usual:

```python
import numpy as np
lam = np.linalg.eigvalsh(np.cov(X.T))
d_eff = lam.sum()**2 / (lam**2).sum()
```

Footnotes[^1] and tables work too.

| task | forgetting |
|------|-----------:|
| A    | 0.12       |
| B    | 0.31       |

[^1]: Like this one.
