import '../../workbench-tokens.css';
import { AstryxAvatar } from '../../components/AstryxAvatar';
import { AstryxBadge } from '../../components/AstryxBadge';
import { AstryxButton } from '../../components/AstryxButton';
import { AstryxCard } from '../../components/AstryxCard';
import { AstryxCarousel } from '../../components/AstryxCarousel';
import { AstryxDropdownMenu } from '../../components/AstryxDropdownMenu';
import { AstryxDropdownMenuItem } from '../../components/AstryxDropdownMenuItem';
import { AstryxGradient } from '../../components/AstryxGradient';
import { AstryxIconButton } from '../../components/AstryxIconButton';
import { AstryxSideNav } from '../../components/AstryxSideNav';
import { AstryxSideNavCollapseWrapper } from '../../components/AstryxSideNavCollapseWrapper';
import { AstryxSideNavHeading } from '../../components/AstryxSideNavHeading';
import { AstryxSideNavItem } from '../../components/AstryxSideNavItem';
import { AstryxSideNavSection } from '../../components/AstryxSideNavSection';
import { AstryxSideNavSlot } from '../../components/AstryxSideNavSlot';
import { AstryxStack } from '../../components/AstryxStack';
import { AstryxText } from '../../components/AstryxText';
import { AstryxTheme } from '../../components/AstryxTheme';
import { AstryxDivider } from '../../components/AstryxDivider';

export default function WorkbenchDesignPage() {
  return (
      <AstryxTheme style={{ position: "relative" }} as="main" colorMode="auto" theme="neutral">
        <AstryxStack data-astryx-wb-side-nav-layout className="astra-floating-shell relative min-h-screen w-screen overflow-visible" as="div" direction="horizontal" align="stretch" justify="start" wrap="nowrap" gap="lg" padding="none">

          <AstryxStack style={{ position: "fixed", top: "0px", left: "0px" }} className="astra-floating-sidebar fixed left-0 top-0 z-20 h-screen self-start" as="aside" direction="vertical" align="stretch" justify="between" wrap="nowrap" gap="none" padding="sm">
            <AstryxSideNav defaultIsCollapsed={false} className="overflow-hidden bg-transparent backdrop-blur-2xl bg-color-background-body/50 shadow-2xl border border-accent/10 rounded-3xl" resizable={true} hasCollapseButton={true} collapseButtonLabel="Toggle navigation" collapsible={true}>
              <AstryxSideNavHeading subheading="astryx music player" brandDisplay="signature" collapsedBrandDisplay="symbol" heading="ASTRA" superheading="" icon="music2" />
              <AstryxSideNavSlot className="space-y-1 py-4" collapsedBehavior="auto" slot="topContent">
                <AstryxSideNavItem label="검색" href="#" icon="search" size="lg" />
                <AstryxSideNavItem label="홈" href="#" icon="home" size="lg" isSelected={true} emphasis="default" />
                <AstryxSideNavItem label="새로운 음악" href="#" icon="music2" size="lg" />
                <AstryxSideNavItem label="라디오" href="#" icon="mic" size="lg" />
              </AstryxSideNavSlot>
              <AstryxSideNavSection title="Library" subtitle="">
                <AstryxSideNavItem size="lg" href="#" icon="clock" label="최근 재생 음악" />
                <AstryxSideNavItem href="#" icon="check" label="즐겨찾는 노래" />
                <AstryxSideNavItem size="lg" href="#" icon="music2" label="칠 아웃 인디" />
                <AstryxSideNavItem href="#" icon="arrowsUpDown" label="나의 필수 트랙 믹스" />
</AstryxSideNavSection>
              <AstryxSideNavSlot collapsedBehavior="show" slot="footer">
                <AstryxStack className="rounded-xl" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="sm" padding="none">
                  <AstryxSideNavCollapseWrapper behavior="show">
                    <AstryxAvatar style={{ height: "36px" }} src="/workbench-assets/images/album-samples/bright-sphere-arch.png" name="tom moon" status="error" size="small" statusLabel="" />
                  </AstryxSideNavCollapseWrapper>
                  <AstryxSideNavCollapseWrapper behavior="hide">
                    <AstryxStack as="div" direction="vertical" align="start" justify="start" wrap="nowrap" gap="xs" padding="none">
                      <AstryxText as="span" type="body" size="base" weight="bold" color="inherit" display="inline" lineHeight="tight">tom moon</AstryxText>
                      <AstryxText as="span" type="supporting" size="sm" weight="medium" color="secondary" display="inline" lineHeight="tight">private station</AstryxText>
                    </AstryxStack>
                  </AstryxSideNavCollapseWrapper>
                </AstryxStack>
              </AstryxSideNavSlot>
</AstryxSideNav>
          </AstryxStack>

          <AstryxStack className="z-10 min-h-screen min-w-0 flex-1 pb-36" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="2xl" padding="none">
            <AstryxStack style={{ overflow: "hidden" }} className="relative overflow-hidden h-[40vh] pl-sidebar-24" as="section" direction="vertical" align="stretch" justify="between" wrap="nowrap" gap="xl" padding="none">


              <img className="absolute top-0 object-cover object-center opacity-95 h-[70vh] w-[100vw] right-0" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/capsule-grid.png" alt="" />
              <AstryxGradient repeatSize={18} startColorTokenCollection="astryx-theme" startColorToken="color-background-body" endColorTokenCollection="astryx-theme" endColorToken="color-background-body" className="pointer-events-none absolute inset-0 w-full h-[40vh] top-0" startColor="var(--color-background-body)" endColor="var(--color-background-body)" fadeStart={100} fadeEnd={0} endX={0} endY={100} backdropBlur={0} kind="linear" easing="ease-in-out" />
              <AstryxGradient rotation={270} repeatSize={18} startColorTokenCollection="astryx-theme" startColorToken="color-background-body" endColorTokenCollection="astryx-theme" endColorToken="color-background-body" className="absolute w-[100vw] h-[70vh] right-0" startColor="var(--color-background-body)" endColor="var(--color-background-body)" fadeStart={0} fadeEnd={80} endX={0} endY={0} backdropBlur={0} kind="linear" easing="ease-in-out" />
              <AstryxStack className="relative z-10 h-full py-4" as="div" direction="horizontal" align="start" justify="between" wrap="nowrap" gap="lg" padding="none">
              <AstryxStack className="w-1/3 self-end" as="div" direction="vertical" align="start" justify="start" wrap="nowrap" gap="sm" padding="none">
                <AstryxBadge label="ASTRA PICK" variant="red" />
                <AstryxText as="h2" type="large" size="3xl" weight="bold" color="primary" display="block" lineHeight="tight">DIVINE INTERVENTION</AstryxText>

                <AstryxStack className="relative z-10 max-w-xl" as="div" direction="vertical" align="start" justify="start" wrap="nowrap" gap="md" padding="none">
                                <AstryxText style={{ overflow: "visible" }} as="p" type="body" size="base" weight="medium" color="inherit" display="block" lineHeight="normal">진한 버건디 톤 위에 오늘 들을 음악을 길게 펼쳐둔 홈 화면입니다. 큰 커버, 큐레이션 카드, 트랙 보드, 하단 미니 플레이어가 한 화면에서 이어지도록 구성했습니다.</AstryxText>
                                <AstryxStack as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                                  <AstryxDropdownMenu label="더보기" variant="primary" placement="below" size="sm" hasChevron={true} menuWidth="320px">
                                    <AstryxDropdownMenuItem icon="play" label="Divine Intervention 재생" />
                                    <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                                    <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                                    <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                                    <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                                    <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                                    <AstryxDropdownMenuItem icon="share" label="공유" />
                                  </AstryxDropdownMenu>
                                </AstryxStack>
                              </AstryxStack>
              </AstryxStack>
                <AstryxStack className="rounded-full p-2 backdrop-blur-xl bg-color-background-body/50 mt-auto mr-4" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="sm" padding="none">
                <AstryxIconButton label="이전" icon="chevronLeft" variant="ghost" size="sm" tooltip="이전" />
                <AstryxIconButton label="재생" icon="play" variant="primary" size="lg" tooltip="재생" />
                <AstryxIconButton label="다음" icon="chevronRight" variant="ghost" size="sm" tooltip="다음" />
                </AstryxStack>
</AstryxStack>
</AstryxStack>

            <AstryxStack as="section" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="md" padding="none">
              <AstryxText className="pl-sidebar-24" as="h2" type="large" size="xl" weight="bold" color="primary" display="block" lineHeight="tight">오늘의 무드 큐레이션</AstryxText>
              <AstryxCarousel itemMinWidth="320px" itemsPerView={4} className="pl-sidebar-24" paddingEnd={24} paddingStart={0} edgeFadeSize="sm" label="Mood curation" gap="md" hasButtons={false} hasEdgeFade={false} hasSnap={true} padding="2xl">
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/concentric-iris.png\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundBlendMode: "normal" }} className="relative bg-[#1c2633] h-120 w-full" variant="muted" padding="lg">
                  <AstryxGradient startY={50} startX={50} endY={100} endX={100} rotation={180} className="absolute inset-0 h-full w-full" startColor="#e24a26" endColor="#25110b" fadeStart={0} fadeEnd={100} backdropBlur={40} kind="conic" easing="ease-out" />
                  <AstryxText className="relative z-10 mix-blend-difference" as="h3" type="display-3" size="4xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Road warmers</AstryxText>
                  <AstryxText className="absolute bottom-6 left-6 right-6" as="p" type="supporting" size="sm" weight="bold" color="static-dark" display="block" lineHeight="normal">이동 중에도 오래 듣기 좋은 선명한 멜로디.</AstryxText>
                </AstryxCard>
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/capsule-grid.png\")", backgroundSize: "cover"}} className="relative bg-[#1c2633] h-120 w-full" variant="green" padding="lg">
                  <AstryxText className="relative z-10 mix-blend-difference" as="h3" type="display-3" size="4xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Late night glow</AstryxText>
                  <AstryxGradient style={{ top: "0px"}} className="absolute inset-0 h-full w-full" startColor="#6131a8" endColor="#1a101f" fadeStart={0} fadeEnd={100} backdropBlur={24} kind="linear" easing="smoothstep" />
                  <AstryxText className="absolute bottom-6 left-6 right-6" as="p" type="supporting" size="sm" weight="bold" color="static-dark" display="block" lineHeight="normal">밤에 어울리는 신스, 네온, 느린 드럼.</AstryxText>
                </AstryxCard>
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/geometric-cube.png\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundBlendMode: "normal", overflow: "hidden" }} className="relative bg-[#321914] h-120 w-full" variant="muted" padding="md">
                  <AstryxGradient startY={0} startX={0} repeatSize={40} opacity={1} endX={0} endY={0} rotation={0} className="absolute inset-0 w-full h-full self-end rounded-none" startColor="" endColor="#2a120d" fadeStart={100} fadeEnd={0} backdropBlur={24} kind="conic" easing="sine" />
                  <AstryxText className="relative z-10 mix-blend-difference" as="h3" type="display-3" size="4xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Chill out indie</AstryxText>
                  <AstryxText className="bottom-6 left-6 right-6 mt-auto z-10" as="p" type="supporting" size="sm" weight="bold" color="static-dark" display="block" lineHeight="normal">낮은 템포의 기타, 따뜻한 보컬, 조금 흐릿한 질감.</AstryxText>

                </AstryxCard>
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/cylinder-grid.png\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundBlendMode: "normal" }} className="relative bg-[#1c2633] h-120 w-full" variant="muted" padding="lg">
                  <AstryxGradient className="absolute inset-0 h-full w-full" startColor="#b45309" endColor="#23120c" fadeStart={0} fadeEnd={100} backdropBlur={20} kind="radial" easing="sine" />
                  <AstryxText className="relative z-10 mix-blend-difference" as="h3" type="display-3" size="4xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Golden hour</AstryxText>
                  <AstryxText className="absolute bottom-6 left-6 right-6" as="p" type="supporting" size="sm" weight="bold" color="static-dark" display="block" lineHeight="normal">노을빛처럼 따뜻한 드림 팝과 소프트 록.</AstryxText>
                </AstryxCard>
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/geometric-cube.png\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundBlendMode: "normal" }} className="relative bg-[#1c2633] h-120 w-full" variant="muted" padding="lg">
                  <AstryxGradient className="absolute inset-0 h-full w-full" startColor="#a21caf" endColor="#17111f" fadeStart={0} fadeEnd={100} backdropBlur={22} kind="conic" easing="smoothstep" />
                  <AstryxText className="relative z-10 mix-blend-difference" as="h3" type="display-3" size="4xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Faded neon</AstryxText>
                  <AstryxText className="absolute bottom-6 left-6 right-6" as="p" type="supporting" size="sm" weight="bold" color="static-dark" display="block" lineHeight="normal">희미한 네온과 느슨한 전자음의 조합.</AstryxText>
                </AstryxCard>
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/bright-sphere-arch.png\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundBlendMode: "normal" }} className="relative bg-[#1c2633] h-120 w-full" variant="muted" padding="lg">
                  <AstryxGradient className="absolute inset-0 h-full w-full" startColor="#0f766e" endColor="#12201c" fadeStart={0} fadeEnd={100} backdropBlur={22} kind="linear" easing="sine" />
                  <AstryxText className="relative z-10 mix-blend-difference" as="h3" type="display-3" size="4xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Soft pulse</AstryxText>
                  <AstryxText className="absolute bottom-6 left-6 right-6" as="p" type="supporting" size="sm" weight="bold" color="static-dark" display="block" lineHeight="normal">작게 뛰는 베이스와 잔잔한 리듬.</AstryxText>
                </AstryxCard>
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/concentric-iris.png\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundBlendMode: "normal" }} className="relative bg-[#1c2633] h-120 w-full" variant="muted" padding="lg">
                  <AstryxGradient className="absolute inset-0 h-full w-full" startColor="#0369a1" endColor="#111827" fadeStart={0} fadeEnd={100} backdropBlur={20} kind="radial" easing="sine" />
                  <AstryxText className="relative z-10 mix-blend-difference" as="h3" type="display-3" size="4xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Rain window</AstryxText>
                  <AstryxText className="absolute bottom-6 left-6 right-6" as="p" type="supporting" size="sm" weight="bold" color="static-dark" display="block" lineHeight="normal">비 오는 창가에 어울리는 촉촉한 사운드.</AstryxText>
                </AstryxCard>
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/capsule-grid.png\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundBlendMode: "normal" }} className="relative bg-[#1c2633] h-120 w-full" variant="muted" padding="lg">
                  <AstryxGradient className="absolute inset-0 h-full w-full" startColor="#57534e" endColor="#160f0b" fadeStart={0} fadeEnd={100} backdropBlur={18} kind="linear" easing="ease-out" />
                  <AstryxText className="relative z-10 mix-blend-difference" as="h3" type="display-3" size="4xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Slow coffee</AstryxText>
                  <AstryxText className="absolute bottom-6 left-6 right-6" as="p" type="supporting" size="sm" weight="bold" color="static-dark" display="block" lineHeight="normal">아침을 천천히 열어주는 낮은 밀도의 곡.</AstryxText>
                </AstryxCard>
              </AstryxCarousel>
            </AstryxStack>

            <AstryxStack as="section" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="md" padding="none">
              <AstryxStack className="pl-sidebar-24 pr-6" as="div" direction="horizontal" align="center" justify="between" wrap="nowrap" gap="md" padding="none">
                <AstryxText as="h2" type="large" size="xl" weight="bold" color="inherit" display="block" lineHeight="tight">트랙 보드</AstryxText>
                <AstryxButton label="전체 보기" variant="ghost" size="sm" />
              </AstryxStack>
              <AstryxCarousel itemMinWidth="320px" itemsPerView={4} paddingEnd={24} paddingStart={0} className="pl-sidebar-24" label="Track board" gap="lg" padding="none" edgeFadeSize="lg" hasButtons={false} hasEdgeFade={false} hasSnap={true}>
                <AstryxCard style={{ borderRadius: "0px" }} className="w-full" variant="transparent" padding="none">
                  <AstryxStack as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="sm" padding="none">
                <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                  <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/bright-sphere-arch.png" alt="Lane 8 Summer Mixtape cover" />
                  <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">Lane 8 Summer Mixtape</AstryxText>
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">Lane 8</AstryxText>
                  </AstryxStack>
                  <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="Lane 8 Summer Mixtape 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                    <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                    <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                    <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                    <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                    <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                    <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                    <AstryxDropdownMenuItem icon="share" label="공유" />
                  </AstryxDropdownMenu>
                </AstryxStack>
                <AstryxDivider className="w-full shrink-0" isFullBleed={false} label="" variant="subtle" orientation="horizontal" />
                <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                  <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/concentric-iris.png" alt="plx - EP cover" />
                  <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">plx - EP</AstryxText>
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">Tennyson</AstryxText>
                  </AstryxStack>
                  <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="plx - EP 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                    <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                    <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                    <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                    <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                    <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                    <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                    <AstryxDropdownMenuItem icon="share" label="공유" />
                  </AstryxDropdownMenu>
                </AstryxStack>
                <AstryxDivider className="w-full shrink-0" isFullBleed={false} label="" variant="subtle" orientation="horizontal" />
                <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                  <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/capsule-grid.png" alt="Indie + Chill cover" />
                  <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">Indie + Chill</AstryxText>
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">Apple Music Indie</AstryxText>
                  </AstryxStack>
                  <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="Indie + Chill 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                    <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                    <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                    <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                    <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                    <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                    <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                    <AstryxDropdownMenuItem icon="share" label="공유" />
                  </AstryxDropdownMenu>
                </AstryxStack>
                  </AstryxStack>
                </AstryxCard>
                  <AstryxCard style={{ borderRadius: "0px" }} className="w-full" variant="transparent" padding="none">
                    <AstryxStack as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="sm" padding="none">
                  <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                    <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/capsule-grid.png" alt="PAREIDOLIA cover" />
                    <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">PAREIDOLIA</AstryxText>
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">Erin LeCount</AstryxText>
                    </AstryxStack>
                    <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="PAREIDOLIA 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                      <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                      <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                      <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                      <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                      <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                      <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                      <AstryxDropdownMenuItem icon="share" label="공유" />
                    </AstryxDropdownMenu>
                  </AstryxStack>
                  <AstryxDivider className="w-full shrink-0" isFullBleed={false} label="" variant="subtle" orientation="horizontal" />
                  <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                    <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/cylinder-grid.png" alt="CONFESSIONS II cover" />
                    <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">CONFESSIONS II</AstryxText>
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">Madonna</AstryxText>
                    </AstryxStack>
                    <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="CONFESSIONS II 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                      <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                      <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                      <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                      <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                      <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                      <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                      <AstryxDropdownMenuItem icon="share" label="공유" />
                    </AstryxDropdownMenu>
                  </AstryxStack>
                  <AstryxDivider className="w-full shrink-0" isFullBleed={false} label="" variant="subtle" orientation="horizontal" />
                  <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                    <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/geometric-cube.png" alt="Never Say Die Legacy cover" />
                    <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">Never Say Die Legacy</AstryxText>
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">Various Artists</AstryxText>
                    </AstryxStack>
                    <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="Never Say Die Legacy 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                      <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                      <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                      <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                      <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                      <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                      <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                      <AstryxDropdownMenuItem icon="share" label="공유" />
                    </AstryxDropdownMenu>
                  </AstryxStack>
                    </AstryxStack>
                  </AstryxCard>
                  <AstryxCard style={{ borderRadius: "0px" }} className="w-full" variant="transparent" padding="none">
                    <AstryxStack as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="sm" padding="none">
                  <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                    <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/capsule-grid.png" alt="Gothic Bloom cover" />
                    <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">Gothic Bloom</AstryxText>
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">Selene Mono</AstryxText>
                    </AstryxStack>
                    <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="Gothic Bloom 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                      <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                      <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                      <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                      <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                      <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                      <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                      <AstryxDropdownMenuItem icon="share" label="공유" />
                    </AstryxDropdownMenu>
                  </AstryxStack>
                  <AstryxDivider className="w-full shrink-0" isFullBleed={false} label="" variant="subtle" orientation="horizontal" />
                  <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                    <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/cylinder-grid.png" alt="Night Stills cover" />
                    <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">Night Stills</AstryxText>
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">Velour Motel</AstryxText>
                    </AstryxStack>
                    <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="Night Stills 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                      <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                      <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                      <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                      <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                      <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                      <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                      <AstryxDropdownMenuItem icon="share" label="공유" />
                    </AstryxDropdownMenu>
                  </AstryxStack>
                  <AstryxDivider className="w-full shrink-0" isFullBleed={false} label="" variant="subtle" orientation="horizontal" />
                  <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                    <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/bright-sphere-arch.png" alt="Fading Choir cover" />
                    <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">Fading Choir</AstryxText>
                      <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">Marble Youth</AstryxText>
                    </AstryxStack>
                    <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="Fading Choir 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                      <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                      <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                      <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                      <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                      <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                      <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                      <AstryxDropdownMenuItem icon="share" label="공유" />
                    </AstryxDropdownMenu>
                  </AstryxStack>
                    </AstryxStack>
                  </AstryxCard>
                              <AstryxCard style={{ borderRadius: "0px" }} className="w-full" variant="transparent" padding="none">
                  <AstryxStack as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="sm" padding="none">
                <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                  <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/concentric-iris.png" alt="After Rain cover" />
                  <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">After Rain</AstryxText>
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">Chelsea Wolfe</AstryxText>
                  </AstryxStack>
                  <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="After Rain 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                    <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                    <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                    <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                    <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                    <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                    <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                    <AstryxDropdownMenuItem icon="share" label="공유" />
                  </AstryxDropdownMenu>
                </AstryxStack>
                <AstryxDivider className="w-full shrink-0" isFullBleed={false} label="" variant="subtle" orientation="horizontal" />
                <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                  <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/bright-sphere-arch.png" alt="Soft Static cover" />
                  <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">Soft Static</AstryxText>
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">Velvet Trip</AstryxText>
                  </AstryxStack>
                  <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="Soft Static 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                    <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                    <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                    <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                    <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                    <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                    <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                    <AstryxDropdownMenuItem icon="share" label="공유" />
                  </AstryxDropdownMenu>
                </AstryxStack>
                <AstryxDivider className="w-full shrink-0" isFullBleed={false} label="" variant="subtle" orientation="horizontal" />
                <AstryxStack className="w-full min-w-0" as="div" direction="horizontal" align="center" justify="start" wrap="nowrap" gap="md" padding="none">
                  <img className="h-14 w-14 shrink-0 rounded object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/cylinder-grid.png" alt="Foreign Tongues cover" />
                  <AstryxStack className="min-w-0 flex-1" as="div" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="none" padding="none">
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="base" color="primary" display="block" lineHeight="inherit">Foreign Tongues</AstryxText>
                    <AstryxText type="body" as="p" weight="normal" justify="start" wrap="wrap" size="sm" color="secondary" display="block" lineHeight="inherit">The Astra Room</AstryxText>
                  </AstryxStack>
                  <AstryxDropdownMenu className="shrink-0" icon="ellipsis" tooltip="더보기" isIconOnly={true} label="Foreign Tongues 옵션" variant="ghost" placement="below" size="sm" hasChevron={false} menuWidth="240px">
                    <AstryxDropdownMenuItem icon="play" label="지금 재생" />
                    <AstryxDropdownMenuItem icon="copy" label="보관함에 추가" />
                    <AstryxDropdownMenuItem icon="viewColumns" label="플레이리스트에 추가" />
                    <AstryxDropdownMenuItem icon="arrowsUpDown" label="비슷한 곡 임의 재생" />
                    <AstryxDropdownMenuItem icon="menu" label="바로 다음에 재생" />
                    <AstryxDropdownMenuItem icon="check" label="즐겨찾기" />
                    <AstryxDropdownMenuItem icon="share" label="공유" />
                  </AstryxDropdownMenu>
                </AstryxStack>
                  </AstryxStack>
                </AstryxCard>
</AstryxCarousel>
            </AstryxStack>

            <AstryxStack as="section" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="md" padding="none">
              <AstryxText className="pl-sidebar-24" as="h2" type="large" size="xl" weight="bold" color="inherit" display="block" lineHeight="tight">앨범과 커버</AstryxText>
              <AstryxCarousel className="pl-sidebar-24" paddingStart={0} paddingEnd={24} label="Albums and covers" gap="md" hasButtons={false} hasEdgeFade={true} hasSnap={true} padding={0}>
                <AstryxCard className="w-56 min-w-56 shrink-0 bg-transparent" variant="transparent" padding="none"><img className="h-56 w-56 rounded-lg object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/bright-sphere-arch.png" alt="" /><AstryxText className="mt-2" as="h3" type="body" size="base" weight="bold" color="primary" display="block" lineHeight="tight">Lane 8 Summer Mixtape</AstryxText><AstryxText as="span" type="supporting" size="sm" weight="medium" color="secondary" display="inline" lineHeight="normal">Lane 8</AstryxText></AstryxCard>
                <AstryxCard className="w-56 min-w-56 shrink-0 bg-transparent" variant="transparent" padding="none"><img className="h-56 w-56 rounded-lg object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/concentric-iris.png" alt="" /><AstryxText className="mt-2" as="h3" type="body" size="base" weight="bold" color="primary" display="block" lineHeight="tight">plx - EP</AstryxText><AstryxText as="span" type="supporting" size="sm" weight="medium" color="secondary" display="inline" lineHeight="normal">Tennyson</AstryxText></AstryxCard>
                <AstryxCard className="w-56 min-w-56 shrink-0 bg-transparent" variant="transparent" padding="none"><img className="h-56 w-56 rounded-lg object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/geometric-cube.png" alt="" /><AstryxText className="mt-2" as="h3" type="body" size="base" weight="bold" color="primary" display="block" lineHeight="tight">Never Say Die Legacy</AstryxText><AstryxText as="span" type="supporting" size="sm" weight="medium" color="secondary" display="inline" lineHeight="normal">Various Artists</AstryxText></AstryxCard>
                <AstryxCard className="w-56 min-w-56 shrink-0 bg-transparent" variant="transparent" padding="none"><img className="h-56 w-56 rounded-lg object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/cylinder-grid.png" alt="" /><AstryxText className="mt-2" as="h3" type="body" size="base" weight="bold" color="primary" display="block" lineHeight="tight">PAREIDOLIA</AstryxText><AstryxText as="span" type="supporting" size="sm" weight="medium" color="secondary" display="inline" lineHeight="normal">Erin LeCount</AstryxText></AstryxCard>
                <AstryxCard className="w-56 min-w-56 shrink-0 bg-transparent" variant="transparent" padding="none"><img className="h-56 w-56 rounded-lg object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/capsule-grid.png" alt="" /><AstryxText className="mt-2" as="h3" type="body" size="base" weight="bold" color="primary" display="block" lineHeight="tight">CONFESSIONS II</AstryxText><AstryxText as="span" type="supporting" size="sm" weight="medium" color="secondary" display="inline" lineHeight="normal">Madonna</AstryxText></AstryxCard>
                <AstryxCard className="w-56 min-w-56 shrink-0 bg-transparent" variant="transparent" padding="none"><img className="h-56 w-56 rounded-lg object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/geometric-cube.png" alt="" /><AstryxText className="mt-2" as="h3" type="body" size="base" weight="bold" color="primary" display="block" lineHeight="tight">Foreign Tongues</AstryxText><AstryxText as="span" type="supporting" size="sm" weight="medium" color="secondary" display="inline" lineHeight="normal">The Astra Room</AstryxText></AstryxCard>
                <AstryxCard className="w-56 min-w-56 shrink-0 bg-transparent" variant="transparent" padding="none"><img className="h-56 w-56 rounded-lg object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/capsule-grid.png" alt="" /><AstryxText className="mt-2" as="h3" type="body" size="base" weight="bold" color="primary" display="block" lineHeight="tight">Indie + Chill</AstryxText><AstryxText as="span" type="supporting" size="sm" weight="medium" color="secondary" display="inline" lineHeight="normal">Apple Music 인디</AstryxText></AstryxCard>
                <AstryxCard className="w-56 min-w-56 shrink-0 bg-transparent" variant="transparent" padding="none"><img className="h-56 w-56 rounded-lg object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/cylinder-grid.png" alt="" /><AstryxText className="mt-2" as="h3" type="body" size="base" weight="bold" color="primary" display="block" lineHeight="tight">After Rain</AstryxText><AstryxText as="span" type="supporting" size="sm" weight="medium" color="secondary" display="inline" lineHeight="normal">Chelsea Wolfe</AstryxText></AstryxCard>
                <AstryxCard className="w-56 min-w-56 shrink-0 bg-transparent" variant="transparent" padding="none"><img className="h-56 w-56 rounded-lg object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/bright-sphere-arch.png" alt="" /><AstryxText className="mt-2" as="h3" type="body" size="base" weight="bold" color="primary" display="block" lineHeight="tight">Soft Static</AstryxText><AstryxText as="span" type="supporting" size="sm" weight="medium" color="secondary" display="inline" lineHeight="normal">Velvet Trip</AstryxText></AstryxCard>
                <AstryxCard className="w-56 min-w-56 shrink-0 bg-transparent" variant="transparent" padding="none"><img className="h-56 w-56 rounded-lg object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/concentric-iris.png" alt="" /><AstryxText className="mt-2" as="h3" type="body" size="base" weight="bold" color="primary" display="block" lineHeight="tight">Moving Cover</AstryxText><AstryxText as="span" type="supporting" size="sm" weight="medium" color="secondary" display="inline" lineHeight="normal">Animated edition</AstryxText></AstryxCard>
              </AstryxCarousel>
            </AstryxStack>

            <AstryxStack as="section" direction="vertical" align="stretch" justify="start" wrap="nowrap" gap="lg" padding="none">
              <AstryxText className="pl-sidebar-24" style={{ height: "20px" }} as="h2" type="large" size="xl" weight="bold" color="inherit" display="block" lineHeight="tight">ASTRA 스테이션</AstryxText>
              <div className="grid grid-cols-4 pl-sidebar-24 pr-6 gap-4">
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/bright-sphere-arch.png\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundBlendMode: "normal" }} className="relative h-52 bg-[#2f1222]" variant="muted" padding="lg"><AstryxGradient className="absolute inset-0 h-full w-full" startColor="#be123c" endColor="#38111d" fadeStart={0} fadeEnd={100} backdropBlur={16} /><AstryxText className="relative z-10" as="h3" type="large" size="2xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Warm vocal</AstryxText><AstryxText className="mt-auto z-1" as="p" type="supporting" size="sm" weight="medium" color="static-dark" display="block" lineHeight="normal">목소리가 앞에 오는 부드러운 트랙.</AstryxText></AstryxCard>
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/capsule-grid.png\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundBlendMode: "normal" }} className="relative h-52 bg-[#351516]" variant="transparent" padding="lg"><AstryxGradient className="absolute inset-0 h-full w-full" startColor="#9f1239" endColor="#1f0f0b" fadeStart={0} fadeEnd={100} backdropBlur={18} /><AstryxText className="relative z-10" as="h3" type="large" size="2xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Deep indie</AstryxText><AstryxText className="mt-auto z-10" as="p" type="supporting" size="sm" weight="medium" color="static-dark" display="block" lineHeight="normal">기타와 로파이 질감을 길게 이어 듣기.</AstryxText></AstryxCard>
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/cylinder-grid.png\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundBlendMode: "normal" }} className="relative h-52 bg-[#1d2432]" variant="muted" padding="lg"><AstryxGradient className="absolute inset-0 h-full w-full" startColor="#1d4ed8" endColor="#15131c" fadeStart={0} fadeEnd={100} backdropBlur={18} /><AstryxText className="relative z-10" as="h3" type="large" size="2xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Night drive</AstryxText><AstryxText className="mt-auto z-10" as="p" type="supporting" size="sm" weight="medium" color="static-dark" display="block" lineHeight="normal">늦은 밤 차 안에서 어울리는 사운드.</AstryxText></AstryxCard>
                <AstryxCard style={{ backgroundImage: "url(\"/workbench-assets/images/album-samples/concentric-iris.png\")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundBlendMode: "normal" }} className="relative h-52 bg-[#16302a]" variant="muted" padding="lg"><AstryxGradient className="absolute inset-0 h-full w-full" startColor="#0f766e" endColor="#0d1b18" fadeStart={0} fadeEnd={100} backdropBlur={18} /><AstryxText className="relative z-10" as="h3" type="large" size="2xl" weight="bold" color="static-dark" display="block" lineHeight="tight">Quiet room</AstryxText><AstryxText className="mt-auto z-10" as="p" type="supporting" size="sm" weight="medium" color="static-dark" display="block" lineHeight="normal">작업 공간에 깔아두기 좋은 배경음.</AstryxText></AstryxCard>
              </div>
            </AstryxStack>
          </AstryxStack>

          <div className="astra-player-dock fixed bottom-5 right-8 z-50 rounded-2xl border border-white/15 px-4 py-3 shadow-2xl backdrop-blur-2xl bg-color-track/50">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5">
              <div className="flex min-w-0 items-center gap-3">
                <img className="h-12 w-12 shrink-0 rounded-md object-cover object-center" data-wb-asset-kind="image" src="/workbench-assets/images/album-samples/geometric-cube.png" alt="" />
                <div className="min-w-0">
                  <AstryxText maxLines={1} as="p" type="body" size="sm" weight="semibold" color="primary" display="block" lineHeight="tight">Divine Intervention</AstryxText>
                  <AstryxText maxLines={1} as="p" type="supporting" size="xs" weight="medium" color="primary" display="block" lineHeight="normal">The Rolling Stones</AstryxText>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AstryxIconButton label="이전 곡" icon="chevronLeft" variant="ghost" size="sm" tooltip="이전 곡" />
                <AstryxIconButton label="재생" icon="play" variant="primary" size="lg" tooltip="재생" />
                <AstryxIconButton label="다음 곡" icon="chevronRight" variant="ghost" size="sm" tooltip="다음 곡" />
              </div>
              <div className="flex items-center justify-end gap-3">
                <AstryxIconButton label="임의 재생" icon="shuffle" variant="ghost" size="sm" tooltip="임의 재생" />
                <AstryxIconButton label="반복" icon="repeat" variant="ghost" size="sm" tooltip="반복" />
                <AstryxIconButton label="볼륨" icon="volume2" variant="ghost" size="sm" tooltip="볼륨" />
                <span className="h-1.5 overflow-hidden rounded-full bg-white/20 w-24"><span className="block h-full w-2/3 rounded-full bg-white/80" /></span>
                <AstryxIconButton label="목록" icon="menu" variant="ghost" size="sm" tooltip="목록" />
              </div>
            </div>
          </div>
        </AstryxStack>
      </AstryxTheme>
  );
}
