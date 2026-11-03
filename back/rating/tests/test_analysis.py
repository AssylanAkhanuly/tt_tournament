"""Наблюдения за шкалой: то, ради чего федерация просила пилот."""
import pytest

from rating.analysis import insights, matches_to_level, win_share
from rating.engine import DEFAULT_PARAMS


def test_доля_побед_растёт_при_узкой_шкале():
    assert win_share(50, 40, 10) > win_share(50, 40, 30)


def test_при_равных_рейтингах_половина():
    assert win_share(40, 40, 15) == pytest.approx(0.5)


def test_без_потолка_новичок_доходит_до_КМС_за_десятки_матчей():
    n = matches_to_level(1, 40, DEFAULT_PARAMS.replace(max_delta=0))
    assert n is not None and n < 60


def test_потолок_в_переходном_периоде_растягивает_путь_в_разы():
    свободно = matches_to_level(1, 40, DEFAULT_PARAMS.replace(max_delta=0))
    с_потолком = matches_to_level(1, 40, DEFAULT_PARAMS.replace(max_delta=1, cap_in_transition=True))
    assert с_потолком > свободно


def test_при_нулевом_K_уровень_недостижим():
    assert matches_to_level(1, 40, DEFAULT_PARAMS.replace(k_standard=0, k_transition=0)) is None


def test_нулевой_путь_если_уже_на_уровне():
    assert matches_to_level(40, 40, DEFAULT_PARAMS) == 0


def test_показатели_собираются_вместе():
    out = insights(DEFAULT_PARAMS)
    assert 0.5 < out["win_share_ms_over_kms"] < 1
    assert out["matches_new_to_kms"] is not None
