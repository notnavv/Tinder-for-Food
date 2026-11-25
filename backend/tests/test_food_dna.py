import pandas as pd

from app.ml.food_dna import compute_food_dna


def test_food_dna_uses_each_dishes_latest_opinion_and_skips_missing_labels():
    history = pd.DataFrame([{"food_id": "1", "liked": True}, {"food_id": "2", "liked": False}])
    foods = pd.DataFrame(
        [
            {
                "id": "1",
                "cuisine": None,
                "protein_category": None,
                "dietary_tags": ["vegan", "vegan"],
                "carbon_footprint": "low",
            },
            {
                "id": "2",
                "cuisine": None,
                "protein_category": None,
                "dietary_tags": ["vegan", "halal"],
                "carbon_footprint": None,
            },
        ]
    )
    dimensions = {dimension.key: dimension for dimension in compute_food_dna(history, foods)}
    assert set(dimensions) == {"dietary_tags", "carbon_footprint"}
    vegan, halal = dimensions["dietary_tags"].scores
    assert (vegan.value, vegan.n, vegan.score) == ("vegan", 2, 0)
    assert (halal.value, halal.n, halal.score) == ("halal", 1, -1)
    assert dimensions["carbon_footprint"].scores[0].score == 1
    assert not compute_food_dna(pd.DataFrame(), foods)
