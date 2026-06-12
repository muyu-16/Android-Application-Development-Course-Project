import SwiftUI

// MARK: - Liquid Glass Card
struct GlassCard<Content: View>: View {
    let content: Content
    var tint: Color = .blue.opacity(0.1)
    var interactive: Bool = false

    init(tint: Color = .blue.opacity(0.1), interactive: Bool = false,
         @ViewBuilder content: () -> Content) {
        self.tint = tint
        self.interactive = interactive
        self.content = content()
    }

    var body: some View {
        if #available(iOS 26, *) {
            content
                .padding(DesignToken.cardPadding)
                .background(
                    RoundedRectangle(cornerRadius: DesignToken.cardCorner)
                        .stroke(DesignToken.glassStroke, lineWidth: 0.5)
                )
                .glassEffect(.regular.tint(tint),
                             in: RoundedRectangle(cornerRadius: DesignToken.cardCorner))
        } else {
            content
                .padding(DesignToken.cardPadding)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: DesignToken.cardCorner))
        }
    }
}

// MARK: - Glass Button
struct GlassButton: View {
    let title: String
    let icon: String
    let action: () -> Void
    var tint: Color = .blue

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundStyle(DesignToken.textPrimary)
                .frame(maxWidth: .infinity, minHeight: 50)
                .padding(.horizontal, 24)
        }
        .glassButtonStyle(tint: tint)
    }
}

extension View {
    func glassButtonStyle(tint: Color = .blue) -> some View {
        if #available(iOS 26, *) {
            return self
                .glassEffect(.regular.tint(tint).interactive(),
                             in: .capsule)
        } else {
            return self
                .buttonStyle(.borderedProminent)
                .tint(tint.opacity(0.6))
                .clipShape(.capsule)
        }
    }
}

// MARK: - Number Tile (SF Pro Rounded)
struct NumberTile: View {
    let value: String
    var size: CGFloat = 64
    var color: Color = .white

    var body: some View {
        Text(value)
            .font(.system(size: size, weight: .bold, design: .rounded))
            .foregroundStyle(color)
            .monospacedDigit()
    }
}

// MARK: - Glass Scoreboard
struct GlassScoreboard: View {
    let win: Int
    let lose: Int
    let draw: Int

    var body: some View {
        HStack(spacing: 0) {
            ScoreItem(label: "WIN", value: win, color: DesignToken.win)
            Divider().frame(height: 40).background(DesignToken.glassStroke)
            ScoreItem(label: "DRAW", value: draw, color: DesignToken.draw)
            Divider().frame(height: 40).background(DesignToken.glassStroke)
            ScoreItem(label: "LOSE", value: lose, color: DesignToken.lose)
        }
        .frame(maxWidth: .infinity)
        .padding(DesignToken.cardPadding)
        .background(
            RoundedRectangle(cornerRadius: DesignToken.cardCorner)
                .stroke(DesignToken.glassStroke, lineWidth: 0.5)
        )
        .glassEffectIfAvailable(.regular.tint(.blue.opacity(0.08)),
                                shape: RoundedRectangle(cornerRadius: DesignToken.cardCorner))
    }
}

struct ScoreItem: View {
    let label: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundStyle(DesignToken.textTertiary)
            Text("\(value)")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Glass Effect Conditional
extension View {
    @ViewBuilder
    func glassEffectIfAvailable(_ glass: Any? = nil,
                                shape: some Shape = .capsule) -> some View {
        if #available(iOS 26, *) {
            let g = glass as? Glass ?? .regular
            self.glassEffect(g, in: shape)
        } else {
            self.background(.ultraThinMaterial)
                .clipShape(shape)
        }
    }
}
