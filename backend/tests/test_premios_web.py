import pytest
from app.domain.models.web_config import WebReward

def test_web_reward_model_defaults():
    reward = WebReward(
        id="premio_12345",
        title="Trufas de Chocolate",
        desc="Valido por 1 caja en Calacoto",
        img="https://res.cloudinary.com/demo/image.png",
        validity="14 dias",
        validity_days=14
    )
    assert reward.id == "premio_12345"
    assert reward.title == "Trufas de Chocolate"
    assert reward.is_active is True
    assert reward.deleted is False
    assert reward.start_date is None
    assert reward.end_date is None

def test_web_reward_soft_delete_preservation():
    r1 = WebReward(
        id="p1",
        title="Premio Antiguo",
        desc="Desc 1",
        img="img1.png",
        validity="7 dias",
        is_active=False,
        deleted=True
    )
    r2 = WebReward(
        id="p2",
        title="Premio Nuevo",
        desc="Desc 2",
        img="img2.png",
        validity="14 dias",
        is_active=True,
        deleted=False
    )
    rewards_list = [r1, r2]
    
    # Simular canje y verificacion de que el eliminado sigue presente con su titulo
    reward_ids = [r.id for r in rewards_list]
    assert "p1" in reward_ids
    assert "p2" in reward_ids
    
    # Solo los no-eliminados se ofrecen en el catalogo publico
    public_rewards = [r for r in rewards_list if not r.deleted]
    assert len(public_rewards) == 1
    assert public_rewards[0].id == "p2"
